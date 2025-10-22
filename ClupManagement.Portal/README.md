# Üniversite Kulüp Yönetim Sistemi (University Club Management System)

Bu proje, üniversite kulüplerinin yönetimini kolaylaştırmak için geliştirilmiş web tabanlı bir yönetim sistemidir. Sistem, kulüp aktivitelerinin planlanması, üye yönetimi, etkinlik organizasyonu ve duyuru yönetimi gibi temel işlevleri sağlar.

## Özellikler

-   Kulüp üye yönetimi
-   Etkinlik planlama ve takibi
-   Duyuru yönetimi
-   Kulüp bütçe takibi
-   Etkinlik katılım kontrolü
-   Yönetici ve üye panelleri

## Teknolojiler

-   React.js
-   Vite
-   Node.js
-   Modern CSS

## Kurulum

Projeyi yerel ortamınıza kurmak için aşağıdaki adımları izleyin:

1. Projeyi klonlayın:

```bash
git clone https://github.com/ucsilahsorler55/ClupManagement.Portal.git
```

2. Proje dizinine gidin:

```bash
cd ClupManagement.Portal
```

3. Gerekli bağımlılıkları yükleyin:

```bash
npm install
```

4. Geliştirme sunucusunu başlatın:

```bash
npm run dev
```

## Yapılandırma

1. `.env` dosyasını oluşturun ve gerekli ortam değişkenlerini ayarlayın:

```env
VITE_API_URL=your_api_url
```

2. API bağlantı ayarlarını `src/services` dizinindeki ilgili dosyalarda güncelleyin.

## Dağıtım (Deployment)

Projeyi canlı ortama dağıtmak için:

1. Üretim sürümünü oluşturun:

```bash
npm run build
```

2. `dist` klasöründe oluşturulan dosyaları web sunucunuza yükleyin.

3. Web sunucunuzu yapılandırın (Apache/Nginx) ve gerekli yönlendirmeleri ayarlayın.

## Geliştirme

-   Yeni özellik geliştirirken lütfen branch oluşturun
-   Kod stiline uygun geliştirme yapın
-   Değişikliklerinizi commit etmeden önce test edin

## Lisans

Bu proje [MIT lisansı](LICENSE) altında lisanslanmıştır.

## İletişim

Sorularınız ve önerileriniz için issue açabilir veya pull request gönderebilirsiniz.

---

Developed with ❤️ for University Clubs
