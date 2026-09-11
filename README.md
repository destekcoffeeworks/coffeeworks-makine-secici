# CoffeeWorks · Makine İhtiyaç Analizi

Satış görüşmesinde kullanılan tek sayfalık statik araç. Temsilci soruları yanıtlar, uygun olmayan modeller gerekçesiyle elenir, sonunda yazdırılabilir bir ihtiyaç raporu üretilir.

Sunucu, veritabanı veya derleme adımı yok — üç dosya ve bir HTML.

## İçerik

| Dosya | İş |
|---|---|
| `index.html` | Sayfa iskeleti |
| `assets/data.js` | **Makine künyeleri ve soru seti.** Güncelleme buradan yapılır |
| `assets/app.js` | Eleme motoru, puanlama, rapor üretimi |
| `assets/style.css` | CoffeeWorks kimliği (lacivert #0f172a / altın #d97706) |

Veri kaynağı: `CoffeeWorks_Makine_Karsilastirma-v3.xlsx` (Eylül 2026).

## GitHub Pages'e alma

```bash
git init
git add .
git commit -m "Makine ihtiyaç analizi aracı"
git branch -M main
git remote add origin git@github.com:<kullanici>/coffeeworks-makine-secici.git
git push -u origin main
```

Depoda **Settings → Pages → Source: Deploy from a branch → main / (root)** seçin. Adres:
`https://<kullanici>.github.io/coffeeworks-makine-secici/`

Notlar:

- Depoyu **private** yapıp Pages'i açmak GitHub Pro/Team gerektirir. Ücretsiz planda public depo şart; sayfa `noindex` etiketli ama içerik herkese açık olur. Fiyat bilgisi bilinçli olarak eklenmedi, sadece teknik veri var.
- `.nojekyll` dosyası duruyor; Jekyll işlemesini kapatır, alt çizgiyle başlayan dosyalarda sorun yaşanmaz.
- Özel alan adı için depoya `CNAME` dosyası ekleyin (örn. `analiz.coffeeworks.com.tr`).
- Tek dosyalık dağıtım da mümkün: klasörü zip'leyip tablete kopyalayın, `index.html` çevrimdışı da çalışır (yalnızca Google Fonts internet ister; yoksa Georgia/Arial'a düşer).

## Makine ekleme veya veri güncelleme

`assets/data.js` içindeki `MAKINELER` dizisine mevcut kayıtlardan birini kopyalayıp doldurun. Eleme motoru için kritik alanlar:

| Alan | Değerler | Motordaki etkisi |
|---|---|---|
| `kapasite` | sayı (fincan/gün) | İhtiyacın %72'sinin altındaysa model elenir, 2,1 katından fazlaysa "aşırı kapasite" uyarısı |
| `pikSinifi` | 1 / 2 / 3 | Pik talebi yüksekken 1 ve 2 puan kaybeder |
| `toz` | `standart` / `opsiyon` / `versiyon` / `yok` | `yok` ise toz ürün isteyen müşteride elenir |
| `sogukKopuk` | `standart` / `opsiyon` / `yok` | `yok` ise soğuk köpük talebinde elenir |
| `ogutucuMax` | sayı | 2'nin altındaysa çift çekirdek talebinde elenir |
| `tank` | `true` / `opsiyon` / `false` | `false` ise şebeke suyu olmayan noktada elenir |
| `zayifHatUygun` | `true` / `false` | `false` ise 10–13 A hatta elenir |
| `sutTemizlik` | `tam` / `yarim` / `manuel` | Değişken personelde puan kaybı ve uyarı |
| `telemetri` | `standart` / `opsiyon` / `bilinmiyor` | Raporlama isteniyorsa standart olan puan kazanır |
| `dogrulandi` | `true` / `false` | `false` ise 30 puan ceza + "yazılı spec alınmadan teklif verilmemeli" uyarısı |

Soru eklemek için `SORULAR` dizisine kayıt açın ve `degerlendir()` içine ilgili kuralı yazın. Teklif kontrol listesi `KONTROL_LISTESI` içinde, her satır kendi gösterim koşuluyla duruyor.

## Bilinçli sınırlar

- Fiyat, iskonto ve sözleşme süresi yok — bunlar görüşmede belirlenir.
- Rapor tarayıcıdan çıkmaz; kayıt tutulmaz, çerez veya analitik yok.
- Angel 3KB ve Golden Paris E2S verisi doğrulanmadı; arayüzde kırmızı işaretli ve rapora uyarı olarak düşüyor.
