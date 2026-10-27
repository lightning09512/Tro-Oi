import { useEffect, useState, type FormEvent } from "react"
import { useNavigate, useParams } from "react-router"
import { Button, Icon } from "@/components/common/legacy"
import useAuth from "@/hooks/useAuth"
import { usePlatform, type RentalListing } from "@/contexts/PlatformContext"
import { useToast } from "@/contexts/ToastContext"
import { apiRequest, isApiMode } from "@/services/apiClient"

export default function ListingEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const { listings, saveListing, categories } = usePlatform()
  const roomTypes = categories.filter((item) => item.type === "Loại phòng" && item.status === "active").map((item) => item.name)
  const amenities = categories.filter((item) => item.type === "Tiện ích" && item.status === "active").map((item) => item.name)
  const existing = listings.find((item) => item.id === id && item.ownerId === user?.id)
  const [form, setForm] = useState({ title: "", location: "", price: "", area: "", type: "Phòng trọ", deposit: "", phone: user?.phone ?? "", description: "", image: "", gallery: [] as string[], amenities: ["Máy lạnh"] as string[], latitude: "", longitude: "" })
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState("")

  useEffect(() => {
    if (!existing) return
    const gallery = [...new Set([existing.image, ...(existing.gallery ?? [])].filter((photo) => photo && !photo.startsWith("/images/rooms/")))].slice(0, 6)
    setForm({
      title: existing.title, location: existing.location,
      price: String(existing.priceValue), area: String(existing.areaValue),
      type: existing.type, deposit: existing.deposit, phone: existing.phone ?? user?.phone ?? "",
      description: existing.description, image: gallery[0] ?? "", gallery,
      amenities: existing.amenities,
      latitude: existing.latitude === undefined ? "" : String(existing.latitude),
      longitude: existing.longitude === undefined ? "" : String(existing.longitude),
    })
  }, [existing])

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }))
  const toggleAmenity = (value: string) => setForm((current) => ({ ...current, amenities: current.amenities.includes(value) ? current.amenities.filter((item) => item !== value) : [...current.amenities, value] }))
  const uploadImages = async (fileList?: FileList | null) => {
    const files = Array.from(fileList ?? [])
    if (!files.length) return
    if (form.gallery.length + files.length > 6) {
      setError("Mỗi tin được thêm tối đa 6 ảnh. Hãy bỏ bớt ảnh trước khi chọn thêm.")
      return
    }
    if (files.some((file) => !file.type.startsWith("image/"))) {
      setError("Vui lòng chỉ chọn tệp hình ảnh.")
      return
    }
    const maxFileSize = isApiMode ? 3_000_000 : 500_000
    if (files.some((file) => file.size > maxFileSize)) {
      setError(isApiMode ? "Mỗi ảnh tải lên cần nhỏ hơn 3 MB." : "Mỗi ảnh demo cần nhỏ hơn 500 KB để lưu ổn định trong trình duyệt.")
      return
    }
    setUploading(true)
    setError("")
    try {
      for (const [index, file] of files.entries()) {
        setUploadProgress(`Đang xử lý ảnh ${index + 1}/${files.length}…`)
        let url: string
        if (isApiMode) {
          const body = new FormData()
          body.append("file", file)
          const result = await apiRequest<{ url: string }>("uploads/image", { method: "POST", body })
          url = result.url
        } else {
          url = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Không thể đọc ảnh này."))
            reader.onerror = () => reject(new Error("Không thể đọc ảnh này. Hãy thử một tệp khác."))
            reader.readAsDataURL(file)
          })
        }
        setForm((current) => {
          const gallery = [...new Set([...current.gallery, url])].slice(0, 6)
          return { ...current, gallery, image: current.image || gallery[0] || "" }
        })
      }
      setUploadProgress(`${files.length} ảnh đã được thêm vào tin.`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể tải ảnh lên.")
    } finally {
      setUploading(false)
    }
  }

  const setCoverImageUrl = (value: string) => setForm((current) => {
    const others = current.gallery.filter((photo) => photo !== current.image)
    const gallery = value.trim() ? [...new Set([value.trim(), ...others])].slice(0, 6) : others
    return { ...current, image: value, gallery }
  })
  const removeGalleryImage = (photo: string) => setForm((current) => {
    const gallery = current.gallery.filter((item) => item !== photo)
    return { ...current, gallery, image: current.image === photo ? gallery[0] ?? "" : current.image }
  })
  const makeCoverImage = (photo: string) => setForm((current) => ({ ...current, image: photo, gallery: [photo, ...current.gallery.filter((item) => item !== photo)] }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!form.title.trim() || !form.location.trim() || Number(form.price) <= 0 || Number(form.area) <= 0 || !form.description.trim()) {
      setError("Vui lòng nhập tiêu đề, khu vực, giá, diện tích và mô tả hợp lệ.")
      return
    }
    if (Boolean(form.latitude.trim()) !== Boolean(form.longitude.trim()) || (form.latitude && (!Number.isFinite(Number(form.latitude)) || Number(form.latitude) < -90 || Number(form.latitude) > 90)) || (form.longitude && (!Number.isFinite(Number(form.longitude)) || Number(form.longitude) < -180 || Number(form.longitude) > 180))) {
      setError("Nhập cả vĩ độ và kinh độ hợp lệ, hoặc để trống cả hai.")
      return
    }
    if (form.gallery.length < 2 || !form.image.trim()) { setError("Thêm ít nhất 2 ảnh thực tế của cùng phòng trước khi gửi tin."); return }
    if (uploading) { setError("Đợi ảnh tải lên xong rồi lưu tin."); return }
    const item: RentalListing = {
      id: existing?.id ?? `room-${Date.now()}`,
      title: form.title.trim(),
      location: form.location.trim(),
      price: `${Number(form.price).toLocaleString("vi-VN")}đ`,
      priceValue: Number(form.price),
      area: `${Number(form.area)} m²`,
      areaValue: Number(form.area),
      type: form.type,
      image: form.image,
      gallery: [...new Set([form.image, ...form.gallery].filter(Boolean))].slice(0, 6),
      badge: existing?.badge ?? "Mới đăng",
      amenities: form.amenities,
      mapX: existing?.mapX ?? 50,
      mapY: existing?.mapY ?? 50,
      latitude: form.latitude ? Number(form.latitude) : existing?.latitude ?? (isApiMode ? undefined : 10.7769),
      longitude: form.longitude ? Number(form.longitude) : existing?.longitude ?? (isApiMode ? undefined : 106.7009),
      ownerId: user?.id ?? "",
      ownerName: user?.name ?? "",
      phone: form.phone,
      deposit: form.deposit || "Thỏa thuận",
      description: form.description.trim(),
      status: existing?.status === "rejected" ? "pending" : existing?.status ?? "pending",
      currentTenantId: existing?.currentTenantId ?? null,
      views: existing?.views ?? 0,
      contacts: existing?.contacts ?? 0,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    }
    try {
      await saveListing(item)
      setSaved(true)
      toast(existing ? "Đã lưu thay đổi tin phòng thành công!" : "Tin phòng đã được gửi duyệt thành công!", "success")
      window.setTimeout(() => navigate("/chu-tro/quan-ly-tin"), 800)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể lưu tin phòng.")
    }
  }

  return (
    <main className="workspace-page">
      <div className="container workspace-container editor-container">
        <button className="back-link" onClick={() => navigate("/chu-tro/quan-ly-tin")}><Icon name="chevron" size={15} /> Quay lại danh sách tin</button>
        <div className="page-heading-row editor-heading">
          <div><span className="eyebrow">Tin cho thuê</span><h1>{existing ? "Cập nhật thông tin phòng" : "Đăng tin cho thuê"}</h1><p>Thông tin rõ ràng giúp người thuê hiểu đúng về căn phòng trước khi liên hệ.</p></div>
          <span className="editor-step">4 phần thông tin</span>
        </div>
        {saved && <p className="form-message success" role="status">{existing ? "Đã lưu thay đổi." : "Tin đã gửi duyệt. Bạn sẽ thấy trạng thái trong danh sách tin."}</p>}
        {error && <p className="form-message error" role="alert">{error}</p>}
        <form className="listing-editor" onSubmit={submit}>
          {/* Khối 1: Thông tin cơ bản & Vị trí */}
          <section className="editor-card">
            <div className="editor-section-title"><span>01</span><div><h2>Thông tin cơ bản & Vị trí</h2><p>Tiêu đề, địa chỉ và loại phòng giúp người thuê dễ dàng tìm kiếm.</p></div></div>
            <label className="form-field"><span>Tiêu đề tin <b>*</b></span><input maxLength={90} value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="Ví dụ: Phòng ban công thoáng mát gần Đại học Bách Khoa..." autoComplete="off"/><small>{form.title.length}/90 ký tự</small></label>
            <div className="editor-fields-two">
              <label className="form-field"><span>Khu vực / Địa chỉ <b>*</b></span><input value={form.location} onChange={(event) => update("location", event.target.value)} placeholder="Quận, phường hoặc địa chỉ cụ thể" autoComplete="off"/></label>
              <label className="form-field"><span>Loại phòng</span><select value={form.type} onChange={(event) => update("type", event.target.value)}>{roomTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
              {isApiMode && <><label className="form-field"><span>Vĩ độ bản đồ (tùy chọn)</span><input type="number" min="-90" max="90" step="any" value={form.latitude} onChange={(event) => update("latitude", event.target.value)} placeholder="Ví dụ: 10.7769"/></label><label className="form-field"><span>Kinh độ bản đồ (tùy chọn)</span><input type="number" min="-180" max="180" step="any" value={form.longitude} onChange={(event) => update("longitude", event.target.value)} placeholder="Ví dụ: 106.7009"/><small>Chỉ nhập tọa độ đã kiểm tra chính xác tại vị trí phòng.</small></label></>}
            </div>
          </section>

          {/* Khối 2: Chi phí & Diện tích */}
          <section className="editor-card">
            <div className="editor-section-title"><span>02</span><div><h2>Chi phí & Diện tích</h2><p>Giá thuê hàng tháng, số tiền đặt cọc và diện tích sử dụng thực tế.</p></div></div>
            <div className="editor-fields-two">
              <label className="form-field"><span>Giá thuê (triệu đồng/tháng) <b>*</b></span><input type="number" min="0.1" step="0.1" value={form.price} onChange={(event) => update("price", event.target.value)} placeholder="Ví dụ: 3.5"/></label>
              <label className="form-field"><span>Tiền cọc</span><input value={form.deposit} onChange={(event) => update("deposit", event.target.value)} placeholder="Ví dụ: 1 tháng tiền thuê (hoặc Thỏa thuận)" autoComplete="off"/></label>
              <label className="form-field"><span>Diện tích (m²) <b>*</b></span><input type="number" min="1" value={form.area} onChange={(event) => update("area", event.target.value)} placeholder="Ví dụ: 25"/></label>
            </div>
          </section>

          {/* Khối 3: Hình ảnh & Tiện ích */}
          <section className="editor-card">
            <div className="editor-section-title"><span>03</span><div><h2>Hình ảnh & Tiện ích</h2><p>Tải từ 2–6 ảnh thực tế của phòng và chọn các tiện ích phòng có sẵn.</p></div></div>
            <label className="form-field"><span>Chọn ảnh từ thiết bị (tối đa 6 ảnh)</span><input type="file" accept="image/*" multiple disabled={uploading || form.gallery.length >= 6} onChange={(event) => { void uploadImages(event.currentTarget.files); event.currentTarget.value = "" }}/><small>{uploading ? uploadProgress : uploadProgress || (isApiMode ? "Mỗi ảnh dưới 3 MB; ảnh được tải lên an toàn." : "Tối đa 6 ảnh, mỗi ảnh dưới 500 KB; ảnh được lưu trong trình duyệt.")}</small></label>
            <label className="form-field"><span>Đường dẫn ảnh đại diện (tùy chọn)</span><input value={form.image} onChange={(event) => setCoverImageUrl(event.target.value)} placeholder="https://..." autoComplete="off"/></label>
            {form.gallery.length > 0 && <div className="listing-gallery-preview" aria-label="Ảnh của tin phòng">{form.gallery.map((photo, index) => <div className="listing-gallery-preview-item" key={photo}><img src={photo} alt={`Ảnh ${index + 1} của phòng`}/><div><button type="button" onClick={() => makeCoverImage(photo)} disabled={form.image === photo}>{form.image === photo ? "Ảnh đại diện" : "Đặt làm ảnh đại diện"}</button><button type="button" onClick={() => removeGalleryImage(photo)} aria-label={`Xóa ảnh ${index + 1}`}>Xóa</button></div></div>)}</div>}
            <fieldset className="amenity-picker" style={{ marginTop: "24px" }}><legend>Tiện ích có sẵn</legend>{amenities.map((item) => <label key={item}><input type="checkbox" checked={form.amenities.includes(item)} onChange={() => toggleAmenity(item)}/>{item}</label>)}</fieldset>
          </section>

          {/* Khối 4: Mô tả chi tiết & Liên hệ */}
          <section className="editor-card">
            <div className="editor-section-title"><span>04</span><div><h2>Mô tả chi tiết & Liên hệ</h2><p>Số điện thoại liên lạc trực tiếp và ghi chú chi tiết cho khách thuê.</p></div></div>
            <div className="editor-fields-two" style={{ marginBottom: "16px" }}>
              <label className="form-field"><span>Số điện thoại liên hệ <b>*</b></span><input value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="09xx xxx xxx" autoComplete="off"/></label>
            </div>
            <label className="form-field"><span>Mô tả chi tiết phòng <b>*</b></span><textarea rows={6} maxLength={1200} value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="Mô tả cụ thể tình trạng phòng, nội thất có sẵn, giờ giấc sinh hoạt, các khoản phí phát sinh (điện, nước, internet, rác, gửi xe)..."/><small>{form.description.length}/1200 ký tự</small></label>
          </section>

          <div className="editor-submit"><span>{existing ? "Kiểm tra lại nội dung trước khi lưu thay đổi." : "Tin mới sẽ ở trạng thái chờ duyệt trước khi hiển thị."}</span><Button icon="send">{existing ? "Lưu cập nhật" : "Gửi duyệt tin"}</Button></div>
        </form>
      </div>
    </main>
  )
}
