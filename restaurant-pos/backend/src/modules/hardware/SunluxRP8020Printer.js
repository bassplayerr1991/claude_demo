/**
 * Sunlux RP8020 Thermal Printer Module
 * Specialized printer driver for Sunlux RP8020 Barkod Yazıcı
 * Supports ESC/POS commands for thermal printing
 */
const EventEmitter = require('events');

class SunluxRP8020Printer extends EventEmitter {
  constructor(id, config) {
    super();
    this.id = id;
    this.config = {
      paperWidth: 80, // 80mm termal kağıt
      encoding: 'UTF-8',
      baudRate: 9600,
      cutPaper: true,
      buzzer: true, // Sipariş yazdırıldığında ses çıkar
      feedLines: 3, // Kesimden önce kaç satır besleme
      ...config
    };

    // ESC/POS komutları
    this.ESC = '\x1B';
    this.GS = '\x1D';
    this.commands = {
      INIT: this.ESC + '@',                    // Yazıcıyı başlat
      BOLD_ON: this.ESC + 'E' + '\x01',        // Kalın yazı aç
      BOLD_OFF: this.ESC + 'E' + '\x00',       // Kalın yazı kapat
      UNDERLINE_ON: this.ESC + '-' + '\x01',   // Alt çizgi aç
      UNDERLINE_OFF: this.ESC + '-' + '\x00',  // Alt çizgi kapat
      ALIGN_LEFT: this.ESC + 'a' + '\x00',     // Sola hizala
      ALIGN_CENTER: this.ESC + 'a' + '\x01',   // Ortaya hizala
      ALIGN_RIGHT: this.ESC + 'a' + '\x02',    // Sağa hizala
      SIZE_NORMAL: this.GS + '!' + '\x00',     // Normal boyut
      SIZE_DOUBLE: this.GS + '!' + '\x11',     // 2x boyut
      SIZE_TRIPLE: this.GS + '!' + '\x22',     // 3x boyut
      CUT_PAPER: this.GS + 'V' + '\x00',       // Kağıt kes
      FEED: this.ESC + 'd' + '\x03',           // 3 satır besle
      BUZZER: this.ESC + 'B' + '\x03' + '\x01' // Buzzer çal
    };
  }

  /**
   * Sipariş fişi yazdır (Sunlux RP8020 için optimize edilmiş)
   */
  async printOrderTicket(orderData) {
    try {
      const ticket = this.formatOrderTicket(orderData);
      await this.print(ticket);

      this.emit('printed', {
        type: 'order_ticket',
        orderId: orderData.id,
        tableNumber: orderData.tableNumber,
        timestamp: new Date()
      });

      return {
        success: true,
        ticket: ticket,
        message: 'Sipariş fişi başarıyla yazdırıldı'
      };
    } catch (error) {
      throw new Error('Yazdırma hatası: ' + error.message);
    }
  }

  /**
   * Mutfak fişi yazdır (Sunlux RP8020 için optimize edilmiş)
   */
  async printKitchenTicket(orderData) {
    try {
      const ticket = this.formatKitchenTicket(orderData);
      await this.print(ticket);

      this.emit('printed', {
        type: 'kitchen_ticket',
        orderId: orderData.id,
        timestamp: new Date()
      });

      return {
        success: true,
        ticket: ticket,
        message: 'Mutfak fişi başarıyla yazdırıldı'
      };
    } catch (error) {
      throw new Error('Yazdırma hatası: ' + error.message);
    }
  }

  /**
   * Sipariş fişini formatla (Müşteri fişi)
   */
  formatOrderTicket(data) {
    const lines = [];

    // Yazıcıyı başlat
    lines.push(this.commands.INIT);

    // Başlık - Büyük ve kalın
    lines.push(this.commands.ALIGN_CENTER);
    lines.push(this.commands.SIZE_DOUBLE);
    lines.push(this.commands.BOLD_ON);
    lines.push('RESTAURANT POS');
    lines.push(this.commands.BOLD_OFF);
    lines.push(this.commands.SIZE_NORMAL);
    lines.push('');

    // Restoran bilgileri
    lines.push('Adres: İstanbul Cad. No:123');
    lines.push('Tel: (0212) 555 12 34');
    lines.push('www.restaurant.com.tr');
    lines.push(this.line('=', 48));
    lines.push('');

    // Sipariş bilgileri
    lines.push(this.commands.ALIGN_LEFT);
    lines.push(this.commands.BOLD_ON);
    lines.push(`SİPARİŞ NO: ${data.orderNumber}`);
    lines.push(this.commands.BOLD_OFF);
    lines.push(`Tarih: ${this.formatDateTime(data.createdAt || new Date())}`);

    if (data.tableNumber) {
      lines.push(this.commands.BOLD_ON);
      lines.push(`MASA: ${data.tableNumber}`);
      lines.push(this.commands.BOLD_OFF);
    }

    if (data.waiterName) {
      lines.push(`Garson: ${data.waiterName}`);
    }

    lines.push(`Sipariş Türü: ${this.translateOrderType(data.orderType)}`);
    lines.push('');
    lines.push(this.line('-', 48));

    // Ürünler tablosu başlığı
    lines.push(this.commands.BOLD_ON);
    const header = this.formatTableRow('ÜRÜN', 'ADET', 'FİYAT', 'TUTAR');
    lines.push(header);
    lines.push(this.commands.BOLD_OFF);
    lines.push(this.line('-', 48));

    // Ürünler
    data.items.forEach(item => {
      const itemName = this.truncate(item.name, 20);
      const qty = item.quantity.toString();
      const price = this.formatPrice(item.price);
      const total = this.formatPrice(item.price * item.quantity);

      lines.push(this.formatTableRow(itemName, qty, price, total));

      // Özel istekler varsa
      if (item.modifications && item.modifications.length > 0) {
        lines.push(this.commands.UNDERLINE_ON);
        item.modifications.forEach(mod => {
          lines.push(`  * ${mod}`);
        });
        lines.push(this.commands.UNDERLINE_OFF);
      }
    });

    lines.push(this.line('-', 48));

    // Özel talimatlar
    if (data.specialInstructions) {
      lines.push('');
      lines.push(this.commands.BOLD_ON);
      lines.push('ÖZEL TALİMATLAR:');
      lines.push(this.commands.BOLD_OFF);
      lines.push(data.specialInstructions);
      lines.push(this.line('-', 48));
    }

    // Ara toplam ve vergi
    const subtotal = data.totalAmount || data.items.reduce((sum, item) =>
      sum + (item.price * item.quantity), 0);
    const taxRate = 0.10; // %10 KDV
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    lines.push('');
    lines.push(this.commands.ALIGN_RIGHT);
    lines.push(`Ara Toplam:${this.formatPrice(subtotal).padStart(25)}`);
    lines.push(`KDV (%10):${this.formatPrice(taxAmount).padStart(27)}`);
    lines.push(this.line('-', 48));

    lines.push(this.commands.BOLD_ON);
    lines.push(this.commands.SIZE_DOUBLE);
    lines.push(`TOPLAM:${this.formatPrice(total).padStart(20)}`);
    lines.push(this.commands.SIZE_NORMAL);
    lines.push(this.commands.BOLD_OFF);

    lines.push(this.commands.ALIGN_CENTER);
    lines.push('');
    lines.push(this.line('=', 48));
    lines.push('');
    lines.push('AFİYET OLSUN!');
    lines.push('BİZİ TERCİH ETTİĞİNİZ İÇİN');
    lines.push('TEŞEKKÜR EDERİZ');
    lines.push('');

    // QR kod için alan (opsiyonel)
    if (data.qrCode) {
      lines.push('');
      lines.push('Değerlendirme için QR kodu okutun');
      lines.push('[QR KOD BURAYA GELECEK]');
      lines.push('');
    }

    lines.push(this.line('=', 48));
    lines.push('');

    // Kağıt besle ve kes
    if (this.config.buzzer) {
      lines.push(this.commands.BUZZER);
    }

    lines.push(this.commands.FEED);

    if (this.config.cutPaper) {
      lines.push(this.commands.CUT_PAPER);
    }

    return lines.join('\n');
  }

  /**
   * Mutfak fişini formatla
   */
  formatKitchenTicket(orderData) {
    const lines = [];

    // Yazıcıyı başlat
    lines.push(this.commands.INIT);

    // Başlık - Çok büyük ve kalın
    lines.push(this.commands.ALIGN_CENTER);
    lines.push(this.commands.SIZE_TRIPLE);
    lines.push(this.commands.BOLD_ON);
    lines.push('*** MUTFAK ***');
    lines.push(this.commands.BOLD_OFF);
    lines.push(this.commands.SIZE_NORMAL);
    lines.push('');
    lines.push(this.line('=', 48));

    // Sipariş bilgileri - Büyük
    lines.push(this.commands.SIZE_DOUBLE);
    lines.push(this.commands.BOLD_ON);
    lines.push(`SİPARİŞ: ${orderData.orderNumber}`);
    lines.push(this.commands.BOLD_OFF);
    lines.push(this.commands.SIZE_NORMAL);

    lines.push(`Saat: ${this.formatTime(new Date())}`);

    if (orderData.tableNumber) {
      lines.push(this.commands.SIZE_DOUBLE);
      lines.push(this.commands.BOLD_ON);
      lines.push(`MASA: ${orderData.tableNumber}`);
      lines.push(this.commands.BOLD_OFF);
      lines.push(this.commands.SIZE_NORMAL);
    }

    lines.push(`Tip: ${this.translateOrderType(orderData.orderType)}`);

    if (orderData.waiterName) {
      lines.push(`Garson: ${orderData.waiterName}`);
    }

    lines.push('');
    lines.push(this.line('=', 48));
    lines.push('');

    // Ürünler - Büyük ve açık
    lines.push(this.commands.SIZE_DOUBLE);
    lines.push(this.commands.BOLD_ON);

    orderData.items.forEach((item, index) => {
      lines.push(`${item.quantity}x ${item.name}`);
      lines.push(this.commands.BOLD_OFF);
      lines.push(this.commands.SIZE_NORMAL);

      // Özel istekler - ÇOK BÜYÜK ve altı çizili
      if (item.modifications && item.modifications.length > 0) {
        lines.push(this.commands.SIZE_DOUBLE);
        lines.push(this.commands.UNDERLINE_ON);
        item.modifications.forEach(mod => {
          lines.push(`   >> ${mod.toUpperCase()} <<`);
        });
        lines.push(this.commands.UNDERLINE_OFF);
        lines.push(this.commands.SIZE_NORMAL);
      }

      lines.push('');
      lines.push(this.commands.SIZE_DOUBLE);
      lines.push(this.commands.BOLD_ON);
    });

    lines.push(this.commands.BOLD_OFF);
    lines.push(this.commands.SIZE_NORMAL);

    // Özel talimatlar - VURGULU
    if (orderData.specialInstructions) {
      lines.push('');
      lines.push(this.line('=', 48));
      lines.push(this.commands.SIZE_DOUBLE);
      lines.push(this.commands.BOLD_ON);
      lines.push(this.commands.UNDERLINE_ON);
      lines.push('ÖZEL TALİMAT:');
      lines.push(this.commands.UNDERLINE_OFF);
      lines.push(orderData.specialInstructions.toUpperCase());
      lines.push(this.commands.BOLD_OFF);
      lines.push(this.commands.SIZE_NORMAL);
    }

    lines.push('');
    lines.push(this.line('=', 48));
    lines.push('');

    // Buzzer - mutfağı uyar
    if (this.config.buzzer) {
      lines.push(this.commands.BUZZER);
      // Çift bip
      lines.push(this.commands.BUZZER);
    }

    // Kağıt besle ve kes
    lines.push(this.commands.FEED);

    if (this.config.cutPaper) {
      lines.push(this.commands.CUT_PAPER);
    }

    return lines.join('\n');
  }

  /**
   * Tablo satırı formatla
   */
  formatTableRow(col1, col2, col3, col4) {
    const c1 = this.truncate(col1, 20).padEnd(20);
    const c2 = col2.toString().padStart(4);
    const c3 = col3.toString().padStart(10);
    const c4 = col4.toString().padStart(10);
    return `${c1} ${c2} ${c3} ${c4}`;
  }

  /**
   * Fiyat formatla
   */
  formatPrice(price) {
    return parseFloat(price).toFixed(2) + ' TL';
  }

  /**
   * Tarih ve saat formatla
   */
  formatDateTime(date) {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hour = d.getHours().toString().padStart(2, '0');
    const minute = d.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hour}:${minute}`;
  }

  /**
   * Sadece saat formatla
   */
  formatTime(date) {
    const d = new Date(date);
    const hour = d.getHours().toString().padStart(2, '0');
    const minute = d.getMinutes().toString().padStart(2, '0');
    const second = d.getSeconds().toString().padStart(2, '0');
    return `${hour}:${minute}:${second}`;
  }

  /**
   * Sipariş türünü Türkçeye çevir
   */
  translateOrderType(type) {
    const types = {
      'dine-in': 'Salonda',
      'takeaway': 'Paket',
      'delivery': 'Gel-Al'
    };
    return types[type] || type;
  }

  /**
   * Çizgi oluştur
   */
  line(char, length) {
    return char.repeat(length);
  }

  /**
   * Metni kısalt
   */
  truncate(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Yazdırma simülasyonu
   */
  async print(content) {
    // Gerçek yazıcıya gönderme simülasyonu
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('=== SUNLUX RP8020 YAZICI ÇIKTISI ===');
        console.log(content);
        console.log('=== YAZICI ÇIKTISI BİTTİ ===');
        resolve();
      }, 500);
    });
  }

  /**
   * Test yazdırma
   */
  async printTest() {
    const testData = {
      orderNumber: 'TEST001',
      tableNumber: '5',
      waiterName: 'Ahmet Yılmaz',
      orderType: 'dine-in',
      items: [
        { name: 'Izgara Somon', quantity: 2, price: 24.99 },
        { name: 'Sezar Salata', quantity: 1, price: 8.99, modifications: ['Sarımsaklı sos yok'] }
      ],
      specialInstructions: 'Müşteri acı yiyemiyor',
      createdAt: new Date()
    };

    return await this.printOrderTicket(testData);
  }
}

module.exports = SunluxRP8020Printer;
