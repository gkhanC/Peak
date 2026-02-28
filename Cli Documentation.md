# Peak CLI Documentation

Peak CLI, donanımlı bir ilerleme takip motoru (Universal Progress Tracking Engine) arayüzüdür. Hem interaktif menüler hem de doğrudan komut satırı argümanları ile çalışabilir.

## Çalışma Mantığı

Peak CLI'ın temel çalışma prensipleri şunlardır:

1.  **Veri Katmanı**: CLI, `@peak/db` paketini kullanarak doğrudan veritabanına (PostgreSQL) bağlanır. Drizzle ORM kullanılarak veriler yönetilir.
2.  **İş Mantığı (Service Layer)**: Karmaşık hesaplamalar (özellikle metriklerin ilerleme durumu - *progression*) `@peak/core` paketindeki `MetricService` tarafından yapılır. Metrikler "hydrate" edilerek ham veritabanı kayıtlarından anlamlı istatistiklere dönüştürülür.
3.  **Giriş Ayrıştırma (Parsing)**: Kullanıcının girdiği karmaşık veriler (örneğin SetxRep formatındaki `3x10`) `parseValuePayload` fonksiyonu ile yapılandırılmış JSON nesnelerine dönüştürülür.
4.  **İlerleme Hesaplama**: Metriklerin ilerlemesi iki ana modda hesaplanır:
    -   `sinceCreation`: Metrik oluşturulduğundan bu yana toplam ilerleme.
    -   `lastTwo`: Son iki veri girişi arasındaki değişim.

---

## Doğrudan Komutlar (Direct Commands)

Terminalden doğrudan çalıştırabileceğiniz komutlar:

### Board İşlemleri
-   `peak new board <name>`: Belirtilen isimle yeni bir board oluşturur.
-   `peak delete board <name>`: Board'u ve içindeki tüm metrikleri/verileri tamamen siler.

### Metrik ve Veri İşlemleri
-   `peak board <bname> new metric <mname>`: Belirli bir board altında yeni bir metrik oluşturmak için interaktif sihirbazı başlatır.
-   `peak board <bname> delete <mname>`: Belirli bir metriği siler.
-   `peak board <bname> setvalue <mname>`: Belirli bir metriğe yeni bir değer eklemek için giriş istemini başlatır.

---

## İnteraktif Menü (Interactive Mode)

Eğer `peak` komutunu herhangi bir argüman olmadan çalıştırırsanız, interaktif bir kullanıcı arayüzü açılır.

### 1. Ana Menü (Main Menu)
-   **Create Board**: Yeni board oluşturma.
-   **Delete Board**: Mevcut board'ları listeler ve seçimle silmenizi sağlar.
-   **Select Board**: Bir board seçerek Board Menüsü'ne girmenizi sağlar.

### 2. Board Menüsü (Board Menu)
Bir board seçtikten sonra aşağıdaki işlemler yapılabilir:
1.  **Add new metric**: Metrik tipi, yönü (Artan/Azalan), birimi ve hedefi gibi özellikleri belirleyerek yeni metrik ekler.
2.  **Delete metric**: Board içindeki bir metriği siler.
3.  **Add value to metric**: Mevcut metrikleri listeler ve seçilen metriğe veri girişi yapar.
4.  **Show metric's information**: Tek bir metriğin kısa geçmişini ve ilerleme yüzdelerini gösterir.
5.  **Show all metrics information**: Board'daki tüm metriklerin özet ilerleme tablosunu çıkarır.
6.  **Show board information**: Board detaylarını ve genel ortalama ilerleme durumunu gösterir.
7.  **Delete a specific metric's logged value**: Bir metriğe ait geçmiş verileri listeler ve seçtiklerinizi silmenizi sağlar.

---

## Desteklenen Metrik Tipleri

Peak CLI şu metrik tiplerini ve veri formatlarını destekler:

| Tip | Örnek Giriş Formatı | Açıklama |
| :--- | :--- | :--- |
| **SingleValue** | `42` | Tekil sayısal değer. |
| **Count** | `5` | Toplam değere ekleme yapar (Cumulative). |
| **Goal** | `75` | Belirli bir hedefe göre ilerleme takibi. |
| **Measurement** | `85.5` | Birimli (kg, km vb.) ölçüm değeri. |
| **SetRep** | `3x12` | Set x Tekrar (Vücut geliştirme vb. için). |
| **CompoundValue** | `10x20` | Bileşik iki değer. |
| **CountTime** | `50=120` | Adet = Süre (saniye bazlı). |
| **Task / Checklist** | `100` | Yüzde bazlı tamamlama. |
| **SetRepTime** | `3x12=60` | Set x Tekrar = Dinlenme/Süre. |

---

## Renkler ve Formatlama
CLI, çıktıları daha rahat okunabilmesi için renklendirir:
-   `Cyan`: Başlıklar ve board bilgileri.
-   `Green`: Başarı mesajları.
-   `Red`: Hatalar ve silme uyarıları.
-   `Yellow`: Metrik detayları.
-   `Magenta`: Board durumu.
