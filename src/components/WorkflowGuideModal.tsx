import { CheckCircle2, ChevronRight, HelpCircle, Layers, Shield, User, X } from 'lucide-react'

export function WorkflowGuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <section className="task-dialog guide-dialog" role="dialog" aria-modal="true">
        <div className="dialog-header">
          <div>
            <span className="eyebrow">TIZIM TUSHUNTIRISHI</span>
            <h2>Qadam platformasi qanday ishlaydi?</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Yopish">
            <X size={18} />
          </button>
        </div>

        <p className="guide-subtitle">
          Qadam — jamoa vazifalarini tartibli va shaffof boshqarish tizimi. Quyida Super Administrator va Dasturchining to‘liq ish jarayoni keltirilgan:
        </p>

        {/* 4 Steps */}
        <div className="workflow-steps-grid">
          <div className="workflow-step-card">
            <div className="step-num">1</div>
            <div className="step-content">
              <strong>1. Topshiriq yaratish (Super Admin)</strong>
              <p>
                Administrator yangi vazifa tuzadi: yo‘nalish (Frontend, Backend va h.k.), muhimlik, muddat va mas’ul dasturchini biriktiradi.
              </p>
              <span className="step-badge badge-admin">Faqat Super Administrator</span>
            </div>
          </div>

          <div className="workflow-step-card">
            <div className="step-num">2</div>
            <div className="step-content">
              <strong>2. Jarayonga olish (Dasturchi)</strong>
              <p>
                Dasturchi o‘z profiliga kiradi va unga biriktirilgan vazifada <em>«▶ Ishni boshlash»</em> tugmasini bosadi. Holat <strong>Jarayonda</strong>ga o‘tadi.
              </p>
              <span className="step-badge badge-developer">Dasturchi</span>
            </div>
          </div>

          <div className="workflow-step-card">
            <div className="step-num">3</div>
            <div className="step-content">
              <strong>3. Natijani tekshiruvga topshirish (Dasturchi)</strong>
              <p>
                Ish yakunlangach, dasturchi natija fayli yoki skrinshotini biriktiradi va <em>«📤 Tekshiruvga yuborish»</em> tugmasini bosadi. Holat <strong>Tekshiruvda</strong>ga o‘tadi.
              </p>
              <span className="step-badge badge-developer">Dasturchi</span>
            </div>
          </div>

          <div className="workflow-step-card">
            <div className="step-num">4</div>
            <div className="step-content">
              <strong>4. Tasdiqlash va yakunlash (Super Admin)</strong>
              <p>
                Administrator topshirilgan ishni tekshiradi. Agar hammasi to‘g‘ri bo‘lsa <strong>Bajarildi</strong> deb tasdiqlaydi, yoki tuzatish uchun qaytaradi.
              </p>
              <span className="step-badge badge-admin">Super Administrator</span>
            </div>
          </div>
        </div>

        {/* Roles Matrix */}
        <div className="detail-section">
          <span className="section-title">
            <Shield size={14} /> Rollar va huquqlar taqsimoti
          </span>
          <div className="table-responsive">
            <table className="guide-table">
              <thead>
                <tr>
                  <th>Amal / Imkoniyat</th>
                  <th>👑 Super Administrator</th>
                  <th>💻 Dasturchi (Ijrochi)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Vazifalarni ko‘rish</td>
                  <td>Barcha dasturchilar vazifalari</td>
                  <td>O‘ziga biriktirilgan vazifalar</td>
                </tr>
                <tr>
                  <td>Yangi vazifa yaratish</td>
                  <td><span className="check-yes"><CheckCircle2 size={14} /> Ha</span></td>
                  <td><span className="check-no">✕ Yo‘q</span></td>
                </tr>
                <tr>
                  <td>Vazifani tahrirlash / o‘chirish</td>
                  <td><span className="check-yes"><CheckCircle2 size={14} /> Ha</span></td>
                  <td><span className="check-no">✕ Yo‘q</span></td>
                </tr>
                <tr>
                  <td>Holatni o‘zgartirish</td>
                  <td>Istalgan holatga (erkin)</td>
                  <td>Yangi → Jarayonda → Tekshiruvda</td>
                </tr>
                <tr>
                  <td>Fayl biriktirish va sharh yozish</td>
                  <td><span className="check-yes"><CheckCircle2 size={14} /> Ha</span></td>
                  <td><span className="check-yes"><CheckCircle2 size={14} /> Ha</span></td>
                </tr>
                <tr>
                  <td>Jamoa a’zolarini boshqarish</td>
                  <td><span className="check-yes"><CheckCircle2 size={14} /> Ha (yaratish, parolni tiklash)</span></td>
                  <td><span className="check-no">✕ Faqat o‘z profilini ko‘rish</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="dialog-actions">
          <button type="button" className="primary-button" onClick={onClose}>
            Tushunarli, ish maydoniga qaytish
          </button>
        </div>
      </section>
    </div>
  )
}

