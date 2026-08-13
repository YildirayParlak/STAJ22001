# Smart Food Factory Monitoring System

Smart Food Factory Monitoring System, endüstriyel otomasyon sistemlerinde fabrika ekipmanlarının web tabanlı bir arayüz üzerinden izlenmesi ve yönetilmesi amacıyla geliştirilmiş bir staj projesidir.

Proje, yazılım mühendisliği ile endüstriyel otomasyon teknolojilerini bir araya getiren bir prototip sistem olarak geliştirilmiştir.

Sistem içerisinde motor yönetimi, alarm takibi, sistem logları, kullanıcı girişi, PLC bağlantı ayarları, Simulation Mode ve Modbus haberleşme altyapısı bulunmaktadır.

---

## Projenin Amacı

Endüstriyel tesislerde PLC, HMI ve SCADA sistemleri üretim süreçlerinin kontrol ve izlenmesinde yaygın olarak kullanılmaktadır.

Bu projede, endüstriyel otomasyon sistemleri ile web teknolojilerinin birlikte kullanılabileceği bir yapı oluşturulması amaçlanmıştır.

Projenin temel amaçları:

- Fabrikadaki motorların durumlarını görüntülemek
- Motorları başlatmak ve durdurmak
- Motor arızalarını simüle etmek
- Oluşan alarmları kayıt altına almak
- Alarmların operatör tarafından onaylanmasını sağlamak
- Motor arızalarını resetlemek
- Sistem üzerinde gerçekleştirilen önemli işlemleri loglamak
- PLC bağlantı ayarlarını web arayüzünden yönetmek
- Simulation Mode ve PLC Mode altyapısı oluşturmak
- Modbus TCP / RTU haberleşmesi için bağlantı altyapısı hazırlamak

---

## Kullanılan Teknolojiler

### Backend

- Python
- FastAPI
- Pydantic
- Uvicorn
- PyModbus

### Frontend

- HTML5
- CSS3
- JavaScript
- Fetch API

### Veritabanı

- SQLite
- DB Browser for SQLite

### Endüstriyel Haberleşme

- Modbus TCP
- Modbus RTU
- PLC bağlantı yapılandırması

---

## Sistem Mimarisi

Proje temel olarak frontend, backend ve veritabanı katmanlarından oluşmaktadır.

```text
Web Arayüzü
HTML / CSS / JavaScript
        |
        | HTTP / REST API
        v
FastAPI Backend
        |
        +------------------+
        |                  |
        v                  v
     SQLite          PLC / Modbus
   Veritabanı         Altyapısı
```

Frontend ve backend arasındaki iletişim HTTP istekleri üzerinden gerçekleştirilmektedir.

JavaScript tarafında Fetch API kullanılarak FastAPI backend üzerinde oluşturulan endpointlere istek gönderilmektedir.

Backend gerekli işlemleri gerçekleştirerek SQLite veritabanından veri okumakta veya veritabanındaki kayıtları güncellemektedir.

---

## Kullanıcı Girişi

Sistemde kullanıcı giriş ekranı bulunmaktadır.

Kullanıcı adı ve parola backend tarafında kontrol edilmekte ve kullanıcı bilgileri SQLite veritabanında tutulmaktadır.

Başarılı giriş sonrasında kullanıcı sistem arayüzüne erişebilmektedir.

---

## Dashboard

Dashboard ekranı fabrikanın genel durumunu görüntülemek amacıyla geliştirilmiştir.

Dashboard üzerinde aşağıdaki bilgiler gösterilmektedir:

- Aktif motor sayısı
- Toplam motor sayısı
- Aktif alarm sayısı
- Sıcaklık
- Basınç
- Nem
- Soğuk hava deposu sıcaklığı
- Üretim değeri
- Enerji değeri

Aktif motor ve alarm sayıları SQLite veritabanındaki mevcut kayıtlardan hesaplanmaktadır.

Proses değerleri ise Simulation Mode kapsamında belirli aralıklarda simüle edilmektedir.

---

## Motor Yönetimi

Sistem içerisinde dört adet motor bulunmaktadır.

Motorlar için aşağıdaki işlemler gerçekleştirilebilmektedir:

- Motor başlatma
- Motor durdurma
- Arıza simülasyonu
- Arıza resetleme
- Çalışma durumunu görüntüleme
- RPM görüntüleme
- Sıcaklık görüntüleme
- Güç görüntüleme
- Yük görüntüleme
- Çalışma süresini takip etme

Motor durumları SQLite veritabanında saklanmaktadır.

Bir motor durdurulduğunda RPM, güç ve yük değerleri arayüzde sıfır olarak gösterilmektedir.

Arızalı bir motor arıza resetlenmeden tekrar çalıştırılamamaktadır.

---

## Alarm Yönetimi

Motorlarda oluşturulan arızalar alarm sistemine aktarılmaktadır.

Alarm kayıtlarında aşağıdaki bilgiler tutulmaktadır:

- Alarm kaynağı
- Kaynak numarası
- Alarm mesajı
- Alarm seviyesi
- Aktif / pasif durumu
- Operatör tarafından onaylanma durumu
- Oluşturulma tarihi
- Kapatılma tarihi

Operatör tarafından alarm onaylama işlemi gerçekleştirilebilmektedir.

Motor arızası resetlendiğinde ilgili aktif alarm kapatılmaktadır.

---

## Sistem Logları

Sistem üzerinde gerçekleştirilen önemli işlemler kayıt altına alınmaktadır.

Örnek sistem logları:

- Motor başlatma
- Motor durdurma
- Motor arızası
- Arıza resetleme
- Alarm onaylama
- PLC ayarlarının değiştirilmesi
- PLC bağlantı denemeleri

Log kayıtları SQLite veritabanındaki `system_logs` tablosunda saklanmaktadır.

---

## PLC Ayarları

Settings bölümü üzerinden PLC haberleşme parametreleri yapılandırılabilmektedir.

Sistemde iki farklı çalışma modu bulunmaktadır.

### Simulation Mode

Gerçek bir PLC bağlantısına ihtiyaç duyulmadan sistemin temel fonksiyonlarının test edilmesini sağlar.

Bu mod özellikle geliştirme ve test aşamalarında kullanılmaktadır.

### PLC Mode

Gerçek PLC haberleşmesine yönelik bağlantı parametrelerinin tanımlanabilmesini sağlar.

Sistem içerisinde Modbus TCP ve Modbus RTU bağlantıları için gerekli yapı oluşturulmuştur.

### Modbus TCP Ayarları

- PLC IP adresi
- Port
- Slave ID

### Modbus RTU Ayarları

- COM Port
- Baud Rate
- Parity
- Stop Bits
- Slave ID

Motorlara ait PLC adresleri de Settings ekranı üzerinden tanımlanabilmektedir.

Örnek adres yapılandırması:

```text
Motor 1 Run   : M100
Motor 1 Start : M101
Motor 1 Stop  : M102
Motor 1 Fault : M103
```

---

## PLC Bağlantı Testi

PLC bağlantısını test etmek amacıyla PyModbus tabanlı bir bağlantı modülü geliştirilmiştir.

Settings ekranındaki "Bağlantıyı Test Et" özelliği backend üzerindeki:

```text
POST /plc/test-connection
```

endpointi ile haberleşmektedir.

Bağlantının başarılı veya başarısız olması durumunda sonuç backend tarafından arayüze gönderilmektedir.

PLC bağlantı denemeleri ayrıca sistem loglarına kaydedilmektedir.

> **Not:** Proje kapsamında PLC haberleşme altyapısı, bağlantı ayarları ve bağlantı testi geliştirilmiştir. Gerçek saha PLC'si üzerinde tam motor kontrol entegrasyonu gerçekleştirilmemiştir.

---

## Veritabanı

Projede SQLite veritabanı kullanılmaktadır.

Başlıca tablolar:

### users

Sistem kullanıcılarının bilgilerini saklamaktadır.

### motors

Motorların durumlarını ve teknik bilgilerini saklamaktadır.

### alarms

Sistemde oluşan alarm kayıtlarını saklamaktadır.

### system_logs

Sistem üzerinde gerçekleştirilen önemli işlemlerin geçmişini saklamaktadır.

### plc_settings

PLC bağlantı parametrelerini ve motor adres yapılandırmalarını saklamaktadır.

---

## API Endpointleri

Backend üzerinde REST API yaklaşımı kullanılmıştır.

### Authentication

```text
POST /auth/login
```

### Motorlar

```text
GET  /motors/status
POST /motors/{motor_id}/start
POST /motors/{motor_id}/stop
POST /motors/{motor_id}/simulate-fault
POST /motors/{motor_id}/reset
```

### Alarmlar

```text
GET  /alarms
POST /alarms/{alarm_id}/acknowledge
```

### Sistem Logları

```text
GET /logs
```

### Dashboard

```text
GET /dashboard/status
GET /status
```

### PLC Ayarları

```text
GET  /settings
POST /settings
```

### PLC Bağlantısı

```text
POST /plc/test-connection
```

---

## Projeyi Çalıştırma

### 1. Proje klasörüne girin

```powershell
cd SmartFactoryMonitoringSystem
```

### 2. Python sanal ortamını aktifleştirin

Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

### 3. Gerekli Python paketlerini yükleyin

```powershell
pip install fastapi uvicorn pymodbus
```

### 4. Veritabanını hazırlayın

```powershell
python backend/database.py
```

### 5. FastAPI sunucusunu başlatın

```powershell
python -m uvicorn backend.main:app --reload
```

Backend varsayılan olarak aşağıdaki adreste çalışmaktadır:

```text
http://127.0.0.1:8000
```

FastAPI tarafından otomatik oluşturulan API dokümantasyonu:

```text
http://127.0.0.1:8000/docs
```

adresinden görüntülenebilir.

---

## Projenin Genel Çalışma Mantığı

Sistemin temel veri akışı aşağıdaki şekildedir:

```text
Kullanıcı
   ↓
Web Arayüzü
   ↓
JavaScript / Fetch API
   ↓
FastAPI REST API
   ↓
SQLite Veritabanı
```

PLC Mode kullanıldığında sisteme ayrıca PLC haberleşme katmanı dahil olmaktadır:

```text
Web Arayüzü
     ↓
FastAPI Backend
     ↓
PLC Haberleşme Modülü
     ↓
Modbus TCP / RTU
     ↓
PLC
```

Bu yapı sayesinde kullanıcı arayüzü, backend, veritabanı ve endüstriyel haberleşme katmanları birbirinden ayrılmıştır.

---

## Proje Kapsamı

Bu uygulama staj çalışması kapsamında prototip olarak geliştirilmiştir.

Gerçek bir üretim tesisinde kullanılacak sistemde ek olarak aşağıdaki konuların geliştirilmesi gerekir:

- Gelişmiş kullanıcı yetkilendirme
- Güvenli oturum yönetimi
- HTTPS
- Ağ ve PLC haberleşme güvenliği
- Gerçek zamanlı PLC veri toplama
- PLC bağlantı hata yönetimi
- Veritabanı yedekleme
- Daha kapsamlı sistem testleri
- Üretim ortamına uygun deployment

---

## Geliştirici

**Yıldıray Parlak**

Yazılım Mühendisliği  
Staj Projesi - 2026