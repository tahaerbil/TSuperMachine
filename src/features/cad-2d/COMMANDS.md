# 2D CAD Commands Reference

Bu dosya TSuperMachine 2D CAD modülündeki tüm komutları, parametrelerini ve geliştirme durumlarını listeler.

**Durum Göstergeleri:**
- ✅ Tamamlandı
- 🔶 Kısmi (bazı özellikler eksik)
- ❌ Henüz yok
- 🔧 Geliştirme aşamasında

---

## 📐 Çizim Komutları (Drawing)

### LINE (L)
**Açıklama:** Sürekli çizgi çizer.

| Parametre             | Durum | Açıklama                                      |
|-----------------------|-------|-----------------------------------------------|
| İlk nokta             |  ✅   | Tıklama veya koordinat (x,y)                  |
| Sonraki noktalar      |  ✅   | Sürekli çizgi, her tıklama yeni segment ekler |
| Space/Enter ile bitir |  ✅   | Komutu sonlandırır                            |
| Escape ile iptal      |  ✅   | Komutu iptal eder                             |
| Close (C)             |  ✅   | İlk noktaya bağlayarak kapat                  |
| Undo (U)              |  ✅   | Son segmenti geri al                          |
| @dx,dy (relative)     |  ✅   | Göreli koordinat girişi                       |
| @length<angle (polar) |  ✅   | Polar koordinat girişi                        |

---

### CIRCLE (C)
**Açıklama:** Daire çizer.

| Parametre | Durum | Açıklama |
|-----------|-------|----------|
| Merkez noktası | ✅ | Tıklama veya koordinat |
| Yarıçap (tıklama) | ✅ | Tıklama ile yarıçap belirleme |
| Yarıçap (değer) | ✅ | Sayısal değer girişi |
| Çap (D) | ✅ | Çap ile daire (merkez + çap noktası) |
| 2P (2 nokta) | ✅ | 2 noktadan geçen daire (çap uç noktaları) |
| 3P (3 nokta) | ✅ | 3 noktadan geçen daire (circumcircle) |
| TTR (Teğet-Teğet-Yarıçap) | ❌ | İki çizgiye teğet daire |

---

### POLYLINE (PL)0
**Açıklama:** Çoklu çizgi çizer.

| Parametre | Durum | Açıklama |
|-----------|-------|----------|
| Noktalar | ✅ | Sürekli nokta ekleme |
| Space/Enter ile bitir | ✅ | Çoklu çizgiyi tamamla |
| Close (C) | ✅ | İlk noktaya bağla ve kapat |
| Undo (U) | ✅ | Son noktayı geri al |
| Arc (A) | ❌ | Yay moduna geç |
| Width (W) | ❌ | Çizgi kalınlığı |
| Halfwidth (H) | ❌ | Yarı kalınlık |

---

### RECTANGLE (REC)
**Açıklama:** Dikdörtgen çizer.

| Parametre | Durum | Açıklama |
|-----------|-------|----------|
| İlk köşe | ✅ | Tıklama veya koordinat |
| Karşı köşe | ✅ | Tıklama veya koordinat |
| Chamfer (C) | ✅ | Köşe pahı |
| Fillet (F) | ✅ | Köşe yuvarlatma |
| Width (W) | ❌ | Çizgi kalınlığı |
| Area (A) | ✅ | Alan ile boyut belirleme |
| Dimensions (D) | ✅ | En-boy ile boyut belirleme |

---

### ARC (A)
**Açıklama:** Yay çizer.

| Parametre | Durum | Açıklama |
|-----------|-------|----------|
| Merkez | ✅ | Merkez noktası (Center modunda) |
| Başlangıç noktası | ✅ | Yayın başladığı nokta |
| Bitiş noktası | ✅ | Yayın bittiği nokta |
| 3P (3 nokta) | ❌ | Başlangıç, orta, bitiş noktası |
| Start-Center-End | ❌ | Alternatif çizim modu |
| Start-Center-Angle | ❌ | Açı ile bitiş |
| Start-Center-Length | ❌ | Kord uzunluğu ile |
| Continue | ❌ | Önceki çizgiden devam |

---

### POLYGON (POL)
**Açıklama:** Düzgün çokgen çizer.

| Parametre | Durum | Açıklama |
|-----------|-------|----------|
| Kenar sayısı | ✅ | Varsayılan 4, sayısal giriş |
| Merkez | ✅ | Tıklama veya koordinat |
| Yarıçap | ✅ | Tıklama veya değer |
| Inscribed (I) | ❌ | Daireye içten teğet |
| Circumscribed (C) | ❌ | Daireye dıştan teğet |
| Edge (E) | ❌ | Kenar uzunluğu ile |

---

### ELLIPSE (EL)
**Açıklama:** Elips çizer.

| Parametre | Durum | Açıklama |
|-----------|-------|----------|
| Merkez | ✅ | Tıklama veya koordinat |
| Major Radius | ✅ | Ana eksen yarıçapı (aks uç noktası) |
| Minor Radius | ✅ | Yan eksen yarıçapı |
| Rotation | ✅ | Döndürme açısı |
| Arc | ❌ | Eliptik yay |

---

### SPLINE (SPL)
**Açıklama:** Spline eğrisi çizer.

| Parametre | Durum | Açıklama |
|-----------|-------|----------|
| Kontrol noktaları | ✅ | Tıklama ile eklenen noktalar |
| Fit noktaları | ❌ | Fit algoritması |
| Tolerance | 🔶 | Basit tolerans |

---

### POINT (PO)
**Açıklama:** Nokta çizer.

| Parametre | Durum | Açıklama |
|-----------|-------|----------|
| Konum | ✅ | Tıklama veya koordinat |

---

### HATCH (H) ❌
**Açıklama:** Alan tarama. **HENÜZ İMPLEMENTE EDİLMEDİ**

---

## ✏️ Düzenleme Komutları (Editing)

### MOVE (M)
**Açıklama:** Seçili nesneleri taşır.

| Parametre | Durum | Açıklama |
|-----------|-------|----------|
| Baz nokta | ✅ | Taşıma referans noktası |
| Hedef nokta | ✅ | Taşınacak konum |
| Displacement değeri | ❌ | @dx,dy ile taşıma |
| Copy (kopya bırak) | ❌ | Orijinali bırakarak taşı |

---

### COPY (CO)
**Açıklama:** Seçili nesneleri kopyalar.

| Parametre | Durum | Açıklama |
|-----------|-------|----------|
| Baz nokta | ✅ | Kopyalama referans noktası |
| Hedef nokta | ✅ | Kopyalanacak konum |
| Multiple | 🔶 | Sürekli kopyalama (tek kopya çalışıyor) |
| Array | ❌ | Dizi halinde kopyalama |

---

### ROTATE (RO)
**Açıklama:** Seçili nesneleri döndürür.

| Parametre | Durum | Açıklama |
|-----------|-------|----------|
| Baz nokta | ✅ | Döndürme merkezi |
| Açı (tıklama) | ✅ | Fare ile açı belirleme |
| Açı (değer) | ❌ | Sayısal açı girişi |
| Copy | ❌ | Orijinali bırakarak döndür |
| Reference | ❌ | Referans açısı ile |

---

### UI_OFFSET (O)
**Açıklama:** Paralel kopya oluşturur.

| Parametre | Durum | Açıklama |
|-----------|-------|----------|
| Mesafe | ✅ | Offset mesafesi |
| Varsayılan mesafe | ✅ | Son kullanılan mesafeyi hatırla |
| Nesne seçimi | ✅ | Offset yapılacak nesne |
| Yön belirleme | ✅ | Tıklama ile yön |
| Through | ❌ | Noktadan geçecek şekilde offset |
| Erase | ❌ | Orijinali sil |
| Layer | ❌ | Hedef katman |
| Multiple | ❌ | Birden fazla offset |

---

### ERASE (E)
**Açıklama:** Seçili nesneleri siler.

| Parametre | Durum | Açıklama |
|-----------|-------|----------|
| Nesne seçimi | ✅ | Tıklama ile seçim |
| Space/Enter ile onayla | ✅ | Silme işlemini tamamla |
| Window seçimi | ✅ | Kutu ile çoklu seçim |
| All | ❌ | Tümünü sil |
| Last | ❌ | Son nesneyi sil |
| Previous | ❌ | Önceki seçimi sil |

---

### SCALE (SC)
**Açıklama:** Seçili nesneleri ölçeklendirir.

| Parametre | Durum | Açıklama |
|-----------|-------|----------|
| Baz nokta | ✅ | Ölçeklendirme merkezi |
| Ölçek faktörü | ✅ | Büyütme/küçültme oranı |
| Copy | ❌ | Orijinali koru |
| Reference | ❌ | Referans uzunluk ile |

---

### SCALE (SC)
**Açıklama:** Seçili nesneleri ölçeklendirir.

| Parametre | Durum | Açıklama |
|-----------|-------|----------|
| Baz nokta | ✅ | Ölçeklendirme merkezi |
| Ölçek faktörü | ✅ | Büyütme/küçültme oranı |
| Copy | ❌ | Orijinali koru |
| Reference | ❌ | Referans uzunluk ile |

---

### MIRROR (MI)
**Açıklama:** Seçili nesneleri yansıtır.

| Parametre | Durum | Açıklama |
|-----------|-------|----------|
| Ayna çizgisi 1. nokta | ✅ | Ayna ekseni başlangıcı |
| Ayna çizgisi 2. nokta | ✅ | Ayna ekseni bitişi |
| Orijinali sil? | ✅ | Varsayılan olarak siler (dönüştürür) |

---

### EXPLODE (X)
**Açıklama:** Nesneyi parçalara ayırma.

| Parametre | Durum | Açıklama |
|-----------|-------|----------|
| Dikdörtgen | ✅ | 4 çizgiye ayırır |
| Polyline | ✅ | Segmentlere ayırır |
| Block | ❌ | Block patlatma henüz yok |

---

### TRIM (TR)
**Açıklama:** Kırpma.

| Parametre | Durum | Açıklama |
|-----------|-------|----------|
| Nesne seçimi | ✅ | Kırpılacak nesneyi seç |
| Kesici sınırlar | ✅ | Otomatik (tüm nesneler sınır) |
| Kısmi silme | ✅ | Seçilen segment silinir (Line için) |

---

### EXTEND (EX)
**Açıklama:** Uzatma.
 
| Parametre | Durum | Açıklama |
|-----------|-------|----------|
| Nesne seçimi | ✅ | Uzatılacak nesneyi seç |
| Sınır seçimi | ✅ | Otomatik (Quick mode) |

---

### ARRAY (AR) ❌
**Açıklama:** Dizi oluşturma. **HENÜZ İMPLEMENTE EDİLMEDİ**

| Parametre | Durum | Açıklama |
|-----------|-------|----------|
| Rectangular | ❌ | Dikdörtgensel dizi |
| Polar | ❌ | Dairesel dizi |
| Path | ❌ | Yol boyunca dizi |

---

### FILLET (F) ❌
**Açıklama:** Köşe yuvarlatma. **HENÜZ İMPLEMENTE EDİLMEDİ**

---

### CHAMFER (CHA) ❌
**Açıklama:** Köşe pahı. **HENÜZ İMPLEMENTE EDİLMEDİ**

---

### BREAK (BR) ❌
**Açıklama:** Nesneyi kırma. **HENÜZ İMPLEMENTE EDİLMEDİ**

---

### JOIN (J) ❌
**Açıklama:** Nesneleri birleştirme. **HENÜZ İMPLEMENTE EDİLMEDİ**

---

## 🎯 Seçim Komutları (Selection)

### Click Selection
| Özellik | Durum | Açıklama |
|---------|-------|----------|
| Tek tıklama seçimi | ✅ | Nesneye tıklayarak seçim |
| Shift+Click toggle | ❌ | Seçime ekle/çıkar |
| Ctrl+Click add | ❌ | Seçime ekle |

### Window Selection
| Özellik | Durum | Açıklama |
|---------|-------|----------|
| Soldan sağa kutu | ✅ | Tamamen içerenler (Engine destekli) |
| Mavi renk | ❌ | Visual feedback (UI tarafı) |

### Crossing Selection
| Özellik | Durum | Açıklama |
|---------|-------|----------|
| Sağdan sola kutu | ✅ | Kesişenler dahil (Engine destekli) |
| Yeşil renk | ❌ | Visual feedback (UI tarafı) |

### Selection Filters ❌
| Özellik | Durum | Açıklama |
|---------|-------|----------|
| Tip filtresi | ❌ | Sadece çizgi, daire vb. |
| Katman filtresi | ❌ | Belirli katman |
| Quick Select | ❌ | Özellik bazlı seçim |

---

## 🔍 Snap (Yakalama) Modu

| Snap Türü | Kısayol | Durum | Açıklama |
|-----------|---------|-------|----------|
| Endpoint | END | ✅ | Uç nokta |
| Midpoint | MID | ✅ | Orta nokta |
| Center | CEN | ✅ | Daire/yay/dikdörtgen merkezi |
| Intersection | INT | ✅ | Kesişim noktası (Çizgi-Çizgi, Çizgi-Daire) |
| Quadrant | QUA | ✅ | Çeyrek noktaları (Daire/Yay) |
| Node | NOD | ✅ | Nokta nesnesi merkezi |
| Perpendicular | PER | ❌ | Dik nokta |
| Tangent | TAN | ❌ | Teğet nokta |
| Nearest | NEA | ❌ | En yakın nokta |
| Extension | EXT | ❌ | Uzantı noktası |
| Parallel | PAR | ❌ | Paralel referans |

---

## 📏 Ölçü Komutları (Dimension) ❌

**Tüm ölçü komutları henüz implemente edilmedi:**

| Komut | Kısayol | Açıklama |
|-------|---------|----------|
| DIM | - | Akıllı ölçü |
| DIMLINEAR | DLI | Doğrusal ölçü |
| DIMALIGNED | DAL | Hizalanmış ölçü |
| DIMRADIUS | DRA | Yarıçap ölçüsü |
| DIMDIAMETER | DDI | Çap ölçüsü |
| DIMANGULAR | DAN | Açı ölçüsü |
| DIMARC | DAR | Yay uzunluğu |
| LEADER | LE | Kılavuz çizgi |

---

## 📝 Yazı Komutları (Text) ❌

**Tüm yazı komutları henüz implemente edilmedi:**

| Komut | Kısayol | Açıklama |
|-------|---------|----------|
| TEXT | T | Tek satır yazı |
| MTEXT | MT | Çok satırlı yazı |
| DDEDIT | ED | Yazı düzenleme |

---

## 🗂️ Katman Yönetimi (Layers) ❌

**Katman sistemi henüz implemente edilmedi:**

| Özellik | Durum | Açıklama |
|---------|-------|----------|
| Katman oluşturma | ❌ | - |
| Katman silme | ❌ | - |
| Renk atama | ❌ | - |
| Çizgi tipi | ❌ | - |
| Görünürlük | ❌ | - |
| Dondurma | ❌ | - |
| Kilitleme | ❌ | - |

---

## 👁️ Görünüm Komutları (View)

| Komut | Durum | Açıklama |
|-------|-------|----------|
| Pan | ✅ | Alt+Sol veya Orta tuş sürükleme |
| Zoom In/Out | ✅ | Mouse scroll |
| Zoom Extents | ❌ | Tüm nesneleri göster |
| Zoom Window | ❌ | Kutu ile zoom |
| Zoom Previous | ❌ | Önceki görünüm |
| Regen | ❌ | Yeniden çiz |

---

## ⌨️ Klavye Kısayolları

| Kısayol | Durum | Aksiyon |
|---------|-------|---------|
| Space | ✅ | Enter gibi davran / son komutu tekrarla |
| Enter | ✅ | Komutu onayla |
| Escape | ✅ | İptal |
| Delete | ✅ | Seçili nesneleri sil |
| ↑/↓ | ✅ | Komut geçmişi |
| Ctrl+Z | ✅ | Geri al (Undo) |
| Ctrl+Y | ✅ | İleri al (Redo) |
| Ctrl+A | ❌ | Tümünü seç |
| Ctrl+C | ✅ | Kopyala (Seçiliyi kopyalar) |
| Ctrl+V | 🔶 | Yapıştır (Henüz tam değil) |
| Ctrl+S | ✅ | Kaydet (DXF Export) |
| F1-F12 | ❌ | Fonksiyon tuşları |

---

## 📁 Dosya İşlemleri

| Özellik | Durum | Açıklama |
|---------|-------|----------|
| Export DXF | ✅ | DXF formatına aktar (Ctrl+S) |
| Import DXF | 🔶 | Basit JSON import var, full DXF parser yok |
| Export SVG | ❌ | SVG formatına aktar |
| Export PNG | ❌ | Görüntü olarak kaydet |
| Export PDF | ❌ | PDF olarak yazdır |

---

## 📊 Özet İstatistikler

| Kategori | Toplam | Tamamlandı | Kısmi | Eksik |
|----------|--------|------------|-------|-------|
| Çizim Komutları | 10 | 9 | 0 | 1 |
| Düzenleme Komutları | 14 | 9 | 1 | 4 |
| Seçim Özellikleri | 8 | 4 | 0 | 4 |
| Snap Türleri | 11 | 7 | 0 | 4 |
| Ölçü Komutları | 8 | 0 | 0 | 8 |
| Yazı Komutları | 3 | 0 | 0 | 3 |
| Katman Özellikleri | 7 | 0 | 0 | 7 |
| Görünüm Komutları | 6 | 2 | 0 | 4 |
| Klavye Kısayolları | 14 | 9 | 1 | 4 |
| Dosya İşlemleri | 5 | 1 | 1 | 3 |

**Genel İlerleme:** ~50% tamamlandı

---

## 🎯 Öncelikli Geliştirme Önerileri

### Yüksek Öncelik
1. **EXTEND** - Trim'in tamamlayıcısı
2. **ARRAY** - Kopyalama işlemleri için
3. **TEXT** - Not alma özelliği
4. **HATCH** - Görsel sunum için

### Orta Öncelik
1. **Katman sistemi** - Organizasyon
2. **Dimension komutları** - Teknik resim için şart

### Düşük Öncelik
1. **Export PDF/PNG** - Çıktı almak
2. **Blok sistemi** (Henüz listelenmedi)
3. **Layout/Paper Space**

---

*Son güncelleme: 2026-01-10*
