// Servicio de Encriptación para BSWorld
// Usa Web Crypto API con AES-GCM para seguridad de nivel militar

class EncryptionService {
  constructor() {
    this.algorithm = {
      name: 'AES-GCM',
      length: 256
    };
    this.keyDerivation = {
      name: 'PBKDF2',
      hash: 'SHA-256',
      iterations: 100000
    };
  }

  /**
   * Genera una clave criptográfica aleatoria
   */
  async generateKey() {
    return await window.crypto.subtle.generateKey(
      this.algorithm,
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Deriva una clave desde una contraseña
   */
  async deriveKeyFromPassword(password, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return await window.crypto.subtle.deriveKey(
      {
        ...this.keyDerivation,
        salt: salt
      },
      keyMaterial,
      this.algorithm,
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Genera un salt aleatorio para derivación de claves
   */
  generateSalt() {
    return window.crypto.getRandomValues(new Uint8Array(16));
  }

  /**
   * Genera un IV (Initialization Vector) aleatorio
   */
  generateIV() {
    return window.crypto.getRandomValues(new Uint8Array(12));
  }

  /**
   * Encripta datos usando AES-GCM
   */
  async encrypt(data, key) {
    const iv = this.generateIV();
    const encoder = new TextEncoder();
    
    // Convertir datos a Uint8Array si es string
    let dataBytes;
    if (typeof data === 'string') {
      dataBytes = encoder.encode(data);
    } else if (data instanceof ArrayBuffer) {
      dataBytes = new Uint8Array(data);
    } else {
      dataBytes = new Uint8Array(data);
    }

    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      dataBytes
    );

    // Combinar IV + datos encriptados
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedData), iv.length);

    return combined;
  }

  /**
   * Desencripta datos usando AES-GCM
   */
  async decrypt(encryptedData, key) {
    const iv = encryptedData.slice(0, 12);
    const data = encryptedData.slice(12);

    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      data
    );

    return new Uint8Array(decryptedData);
  }

  /**
   * Encripta un archivo completo
   */
  async encryptFile(file, key) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const fileData = new Uint8Array(e.target.result);
          const encryptedData = await this.encrypt(fileData, key);
          resolve(encryptedData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Desencripta un archivo completo
   */
  async decryptFile(encryptedData, key) {
    try {
      const decryptedData = await this.decrypt(encryptedData, key);
      return decryptedData;
    } catch (error) {
      throw new Error('Error al desencriptar el archivo');
    }
  }

  /**
   * Convierte datos encriptados a Base64 para almacenamiento
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convierte Base64 a ArrayBuffer
   */
  base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Exporta una clave a formato JSON para almacenamiento seguro
   */
  async exportKey(key) {
    const exported = await window.crypto.subtle.exportKey('jwk', key);
    return JSON.stringify(exported);
  }

  /**
   * Importa una clave desde formato JSON
   */
  async importKey(keyJson) {
    const keyData = JSON.parse(keyJson);
    return await window.crypto.subtle.importKey(
      'jwk',
      keyData,
      this.algorithm,
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Genera un hash de un archivo para verificación de integridad
   */
  async hashFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const fileData = new Uint8Array(e.target.result);
          const hashBuffer = await window.crypto.subtle.digest('SHA-256', fileData);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          resolve(hashHex);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Encripta una URL de descarga (para encriptar el enlace en sí)
   */
  async encryptUrl(url, key) {
    const encrypted = await this.encrypt(url, key);
    return this.arrayBufferToBase64(encrypted);
  }

  /**
   * Desencripta una URL de descarga
   */
  async decryptUrl(encryptedUrl, key) {
    const encryptedData = this.base64ToArrayBuffer(encryptedUrl);
    const decrypted = await this.decrypt(encryptedData, key);
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }
}

// Instancia singleton del servicio
export const encryptionService = new EncryptionService();

// Clave maestra de la aplicación (debe generarse y almacenarse de forma segura)
let masterKey = null;

/**
 * Inicializa el servicio con una clave maestra
 */
export async function initializeEncryption() {
  // En producción, esto debería venir de una fuente segura
  // Por ahora, generamos una clave en memoria
  if (!masterKey) {
    masterKey = await encryptionService.generateKey();
  }
  return masterKey;
}

/**
 * Obtiene la clave maestra
 */
export function getMasterKey() {
  return masterKey;
}

/**
 * Establece la clave maestra (para pruebas)
 */
export function setMasterKey(key) {
  masterKey = key;
}

export default encryptionService;
