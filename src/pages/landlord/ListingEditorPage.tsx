import { useEffect, useRef, useState, type FormEvent } from "react"
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
  const { listings, saveListing, categories, connectionState, connectionError } = usePlatform()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const roomTypes = categories.filter((item) => item.type === "Loại phòng" && item.status === "active").map((item) => item.name)
  const amenities = categories.filter((item) => item.type === "Tiện ích" && item.status === "active").map((item) => item.name)
  const existing = listings.find((item) => item.id === id && item.ownerId === user?.id)
  const [form, setForm] = useState({ title: "", location: "", price: "", area: "", type: "Phòng trọ", deposit: "", phone: user?.phone ?? "", description: "", image: "", gallery: [] as string[], amenities: [] as string[], latitude: "", longitude: "" })
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)
  const uploadingRef = useRef(false)
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
  }, [existing, user?.phone])

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }))
  const toggleAmenity = (value: string) => setForm((current) => ({ ...current, amenities: current.amenities.includes(value) ? current.amenities.filter((item) => item !== value) : [...current.amenities, value] }))

  const uploadImages = async (fileList?: FileList | null) => {
    if (uploadingRef.current || savingRef.current) return
    const files = Array.from(fileList ?? [])
    if (!files.length) return
    if (form.gallery.length + files.length > 6) {
      setError("Mỗi tin phòng được thêm tối đa 6 ảnh. Hãy xóa bớt ảnh trước khi tải thêm.")
      return
    }
    if (files.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type))) {
      setError("Vui lòng chỉ chọn tệp hình ảnh (JPG, PNG, WebP).")
      return
    }
    const maxFileSize = isApiMode ? 4_000_000 : 1_000_000
    if (files.some((file) => file.size > maxFileSize)) {
      setError(isApiMode ? "Mỗi ảnh tải lên cần nhỏ hơn 4 MB." : "Mỗi ảnh demo cần nhỏ hơn 1 MB để lưu ổn định trong trình duyệt.")
      return
    }
    uploadingRef.current = true
    setUploading(true)
    setError("")
    try {
      for (const [index, file] of files.entries()) {
        setUploadProgress(`Đang tải ảnh ${index + 1}/${files.length}…`)
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
          return { ...current, gallery, image: current.image && gallery.includes(current.image) ? current.image : gallery[0] || "" }
        })
      }
      setUploadProgress(`Đã tải lên thành công ${files.length} ảnh.`)
      toast(`Đã tải lên ${files.length} ảnh thành công!`, "success")
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể tải ảnh lên. Vui lòng thử lại.")
    } finally {
      uploadingRef.current = false
      setUploading(false)
      window.setTimeout(() => setUploadProgress(""), 2500)
    }
  }

  const removeGalleryImage = (photo: string) => {
    setForm((current) => {
      const gallery = current.gallery.filter((item) => item !== photo)
      const nextImage = current.image === photo ? gallery[0] ?? "" : current.image
      return { ...current, gallery, image: nextImage }
    })
    toast("Đã xóa ảnh.", "info")
  }

  const makeCoverImage = (photo: string) => {
    setForm((current) => ({ ...current, image: photo }))
    toast("Đã chọn làm ảnh đại diện chính của phòng!", "info")
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (savingRef.current || saved) return
    setError("")
    if (!form.title.trim() || !form.location.trim() || Number(form.price) <= 0 || Number(form.area) <= 0 || !form.description.trim()) {
      setError("Vui lòng nhập tiêu đề, khu vực, giá, diện tích và mô tả hợp lệ.")
      return
    }
    if (Boolean(form.latitude.trim()) !== Boolean(form.longitude.trim()) || (form.latitude && (!Number.isFinite(Number(form.latitude)) || Number(form.latitude) < -90 || Number(form.latitude) > 90)) || (form.longitude && (!Number.isFinite(Number(form.longitude)) || Number(form.longitude) < -180 || Number(form.longitude) > 180))) {
      setError("Nhập cả vĩ độ và kinh độ hợp lệ, hoặc để trống cả hai.")
      return
    }
    if (!Number.isFinite(Number(form.price)) || Number(form.price) > 500 || !Number.isFinite(Number(form.area)) || Number(form.area) > 10000) {
      setError("Giá thuê phải lớn hơn 0 và tối đa 500 triệu đồng; diện tích tối đa 10.000 m².")
      return
    }
    if (!/^\+?[0-9\s().-]{9,20}$/.test(form.phone.trim())) {
      setError("Nhập số điện thoại liên hệ hợp lệ từ 9–20 ký tự.")
      return
    }
    if (form.gallery.length < 2) {
      setError("Vui lòng tải lên ít nhất 2 ảnh thực tế của phòng trước khi gửi duyệt tin.")
      return
    }
    if (uploading) {
      setError("Đang trong quá trình tải ảnh, vui lòng đợi ảnh tải xong trước khi lưu tin.")
      return
    }
    const coverImage = form.image && form.gallery.includes(form.image) ? form.image : form.gallery[0] || ""
    const item: RentalListing = {
      id: existing?.id ?? `room-${Date.now()}`,
      title: form.title.trim(),
      location: form.location.trim(),
      price: `${Math.round(Number(form.price) * 1_000_000).toLocaleString("vi-VN")}đ`,
      priceValue: Number(form.price),
      area: `${Number(form.area)} m²`,
      areaValue: Number(form.area),
      type: form.type,
      image: coverImage,
      gallery: [...new Set([coverImage, ...form.gallery].filter(Boolean))].slice(0, 6),
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
      status: "pending",
      currentTenantId: existing?.currentTenantId ?? null,
      views: existing?.views ?? 0,
      contacts: existing?.contacts ?? 0,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    }
    savingRef.current = true
    setSaving(true)
    try {
      await saveListing(item)
      setSaved(true)
      toast(existing ? "Đã lưu thay đổi tin phòng thành công!" : "Tin phòng đã được gửi duyệt thành công!", "success")
      window.setTimeout(() => navigate("/chu-tro/quan-ly-tin"), 800)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể lưu tin phòng.")
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  return (
    <main className="workspace-page management-page management-editor">
      <div className="container workspace-container editor-container">
        <button className="back-link" onClick={() => navigate("/chu-tro/quan-ly-tin")}><Icon name="chevron" size={15} /> Quay lại danh sách tin</button>
        <div className="page-heading-row editor-heading">
          <div><h1>{existing ? "Cập nhật thông tin phòng" : "Đăng tin cho thuê"}</h1><p>Thông tin rõ ràng giúp người thuê hiểu đúng về căn phòng trước khi liên hệ.</p></div>
          <span className="editor-step">4 phần thông tin</span>
        </div>
        {saved && <p className="form-message success" role="status">{existing ? "Đã lưu thay đổi." : "Tin đã gửi duyệt. Bạn sẽ thấy trạng thái trong danh sách tin."}</p>}
        {error && <p className="form-message error" role="alert">{error}</p>}
        {connectionState === "loading" ? <div className="management-feedback" role="status">Đang tải thông tin tin đăng…</div> : connectionState === "error" ? <div className="form-message error" role="alert">{connectionError || "Chưa tải được dữ liệu. Hãy tải lại trang để thử lại."}</div> : id && !existing ? <section className="empty-state"><Icon name="building" size={28}/><h2>Không thể chỉnh sửa tin này</h2><p>Tin không tồn tại hoặc không thuộc tài khoản của bạn.</p><Button type="button" onClick={() => navigate("/chu-tro/quan-ly-tin")}>Về danh sách tin</Button></section> : existing?.status === "rented" ? <section className="empty-state"><Icon name="building" size={28}/><h2>Phòng đang được cho thuê</h2><p>Hãy cập nhật trạng thái phòng trong danh sách tin trước khi chỉnh sửa nội dung.</p><Button type="button" onClick={() => navigate("/chu-tro/quan-ly-tin")}>Quản lý tin</Button></section> : <form className="listing-editor" onSubmit={submit} aria-busy={saving || uploading}>
          <fieldset className="management-editor-fields" disabled={saving || saved}>
          {/* Khối 1: Thông tin cơ bản & Vị trí */}
          <section className="editor-card">
            <div className="editor-section-title"><div><h2>Thông tin cơ bản & Vị trí</h2><p>Tiêu đề, địa chỉ và loại phòng giúp người thuê dễ dàng tìm kiếm.</p></div></div>
            <label className="form-field"><span>Tiêu đề tin <b>*</b></span><input required minLength={8} maxLength={90} value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="Ví dụ: Phòng ban công thoáng mát gần Đại học Bách Khoa" autoComplete="off"/><small>{form.title.length}/90 ký tự · Tối thiểu 8 ký tự</small></label>
            <div className="editor-fields-two">
              <label className="form-field"><span>Khu vực / Địa chỉ <b>*</b></span><input required minLength={2} maxLength={300} value={form.location} onChange={(event) => update("location", event.target.value)} placeholder="Số nhà, đường, phường/xã, tỉnh/thành phố" autoComplete="street-address"/></label>
              <label className="form-field"><span>Loại phòng</span><select value={form.type} onChange={(event) => update("type", event.target.value)}>{roomTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
              {isApiMode && <><label className="form-field"><span>Vĩ độ bản đồ (tùy chọn)</span><input type="number" min="-90" max="90" step="any" value={form.latitude} onChange={(event) => update("latitude", event.target.value)} placeholder="Ví dụ: 10.7769"/></label><label className="form-field"><span>Kinh độ bản đồ (tùy chọn)</span><input type="number" min="-180" max="180" step="any" value={form.longitude} onChange={(event) => update("longitude", event.target.value)} placeholder="Ví dụ: 106.7009"/><small>Chỉ nhập tọa độ đã kiểm tra chính xác tại vị trí phòng.</small></label></>}
            </div>
          </section>

          {/* Khối 2: Chi phí & Diện tích */}
          <section className="editor-card">
            <div className="editor-section-title"><div><h2>Chi phí & Diện tích</h2><p>Giá thuê hàng tháng, số tiền đặt cọc và diện tích sử dụng thực tế.</p></div></div>
            <div className="editor-fields-two">
              <label className="form-field"><span>Giá thuê (triệu đồng/tháng) <b>*</b></span><input required type="number" min="0.01" max="500" step="0.01" value={form.price} onChange={(event) => update("price", event.target.value)} placeholder="Ví dụ: 3.5"/><small>{Number(form.price) > 0 ? `${Math.round(Number(form.price) * 1_000_000).toLocaleString("vi-VN")}đ / tháng` : "Nhập 3.5 tương ứng 3.500.000đ / tháng."}</small></label>
              <label className="form-field"><span>Tiền cọc</span><input value={form.deposit} onChange={(event) => update("deposit", event.target.value)} placeholder="Ví dụ: 1 tháng tiền thuê (hoặc Thỏa thuận)" autoComplete="off"/></label>
              <label className="form-field"><span>Diện tích (m²) <b>*</b></span><input required type="number" min="1" max="10000" step="0.1" value={form.area} onChange={(event) => update("area", event.target.value)} placeholder="Ví dụ: 25"/></label>
            </div>
          </section>

          {/* Khối 3: Hình ảnh & Tiện ích (100% Tải ảnh trực tiếp từ máy) */}
          <section className="editor-card">
            <div className="editor-section-title"><div><h2>Hình ảnh thực tế & Tiện ích</h2><p>Tải từ 2–6 ảnh chụp thực tế của phòng và chọn các tiện ích có sẵn.</p></div></div>

            {/* Vùng Dropzone Tải ảnh */}
            <div className="photo-upload-section">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden-file-input"
                style={{ display: "none" }}
                disabled={uploading || form.gallery.length >= 6}
                onChange={(event) => {
                  void uploadImages(event.currentTarget.files)
                  event.currentTarget.value = ""
                }}
              />

              <div
                className={`photo-dropzone${isDragging ? " is-dragging" : ""}${form.gallery.length >= 6 ? " is-full" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault()
                  if (form.gallery.length < 6 && !uploading) setIsDragging(true)
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setIsDragging(false)
                  if (form.gallery.length < 6 && !uploading) {
                    void uploadImages(e.dataTransfer.files)
                  }
                }}
              >
                <div className="dropzone-icon">
                  <Icon name="upload" size={28} />
                </div>
                <div className="dropzone-text">
                  <strong>Kéo thả ảnh vào đây hoặc chọn ảnh từ thiết bị</strong>
                  <p>Hỗ trợ định dạng JPG, PNG, WebP (Tối đa 6 ảnh, tải lên từ 2 đến 6 ảnh thực tế)</p>
                </div>
                <button
                  type="button"
                  className="dropzone-browse-btn"
                  disabled={uploading || form.gallery.length >= 6}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Icon name="plus" size={16} /> Chọn ảnh từ thiết bị
                </button>
              </div>

              {uploading && (
                <div className="photo-upload-status" role="status">
                  <span className="upload-spinner" />
                  <span>{uploadProgress || "Đang xử lý tải ảnh lên..."}</span>
                </div>
              )}

              {/* Danh sách ảnh đã tải lên */}
              {form.gallery.length > 0 && (
                <div className="photo-gallery-manager">
                  <div className="gallery-manager-header">
                    <div>
                      <strong>Ảnh đã tải ({form.gallery.length}/6 ảnh)</strong>
                      <p>Bấm "Đặt làm ảnh đại diện" để chọn ảnh bìa xuất hiện trên danh sách tìm kiếm.</p>
                    </div>
                    {form.gallery.length < 6 && (
                      <button
                        type="button"
                        className="btn-add-more-photos"
                        disabled={uploading}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Icon name="plus" size={15} /> Thêm ảnh khác
                      </button>
                    )}
                  </div>

                  <div className="photo-grid-preview">
                    {form.gallery.map((photo, index) => {
                      const isCover = (form.image || form.gallery[0]) === photo
                      return (
                        <div className={`photo-grid-card${isCover ? " is-cover" : ""}`} key={photo}>
                          <div className="photo-grid-thumb">
                            <img src={photo} alt={`Ảnh phòng ${index + 1}`} loading="lazy" />
                            {isCover && (
                              <span className="photo-cover-badge">
                                <Icon name="star" size={12} /> Ảnh đại diện
                              </span>
                            )}
                          </div>
                          <div className="photo-grid-actions">
                            {!isCover ? (
                              <button
                                type="button"
                                className="btn-set-cover"
                                onClick={() => makeCoverImage(photo)}
                              >
                                Đặt làm ảnh bìa
                              </button>
                            ) : (
                              <span className="cover-active-text">Ảnh đại diện</span>
                            )}
                            <button
                              type="button"
                              className="btn-delete-photo"
                              onClick={() => removeGalleryImage(photo)}
                              aria-label={`Xóa ảnh ${index + 1}`}
                              title="Xóa ảnh này"
                            >
                              <Icon name="trash" size={15} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <fieldset className="amenity-picker" style={{ marginTop: "28px" }}>
              <legend>Tiện ích có sẵn</legend>
              {amenities.map((item) => <label key={item}><input type="checkbox" checked={form.amenities.includes(item)} onChange={() => toggleAmenity(item)}/>{item}</label>)}
            </fieldset>
          </section>

          {/* Khối 4: Mô tả chi tiết & Liên hệ */}
          <section className="editor-card">
            <div className="editor-section-title"><div><h2>Mô tả chi tiết & Liên hệ</h2><p>Số điện thoại liên lạc trực tiếp và ghi chú chi tiết cho khách thuê.</p></div></div>
            <div className="editor-fields-two" style={{ marginBottom: "16px" }}>
              <label className="form-field"><span>Số điện thoại liên hệ <b>*</b></span><input required type="tel" minLength={9} maxLength={20} value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="09xx xxx xxx" autoComplete="tel"/></label>
            </div>
            <label className="form-field"><span>Mô tả chi tiết phòng <b>*</b></span><textarea required minLength={10} rows={6} maxLength={1200} value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="Tình trạng phòng, nội thất, giờ giấc và các khoản phí điện, nước, internet, giữ xe…"/><small>{form.description.length}/1200 ký tự · Tối thiểu 10 ký tự</small></label>
          </section>

          </fieldset>
          <div className="editor-submit"><span>{existing ? "Nội dung cập nhật sẽ được gửi duyệt lại trước khi hiển thị." : "Tin mới sẽ ở trạng thái chờ duyệt trước khi hiển thị."}</span><Button icon="send" disabled={saving || uploading || saved}>{saving ? "Đang lưu tin…" : saved ? "Đã gửi duyệt" : existing ? "Lưu và gửi duyệt lại" : "Gửi duyệt tin"}</Button></div>
        </form>}
      </div>
    </main>
  )
}
