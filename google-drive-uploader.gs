/**
 * ==============================================================================
 * Wadfan Studio (วาดฝัน สตูดิโอ) - Google Drive Auto-Uploader
 * ==============================================================================
 * สคริปต์นี้ใช้สำหรับติดตั้งใน Google Apps Script (script.google.com)
 * ภายใต้บัญชี Gmail: wongsakorn.pr1996@gmail.com
 *
 * การทำงาน:
 * 1. รับไฟล์รูปภาพและสลิปโอนเงินที่ลูกค้าอัปโหลดมาจากหน้าเว็บ
 * 2. สร้างโฟลเดอร์หลัก "Wadfan Studio Orders" ใน Google Drive โดยอัตโนมัติ
 * 3. สร้างโฟลเดอร์ย่อยตามเลขออเดอร์ เช่น "WF-20261030-6239 - คุณสมชาย"
 * 4. บันทึกรูปภาพและสลิปโอนเงินลงในโฟลเดอร์นั้น
 * 5. ส่ง URL ของโฟลเดอร์และลิงก์เปิดดูไฟล์กลับไปยังระบบหลังบ้าน Admin
 * ==============================================================================
 */

function doPost(e) {
  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);

    var orderNumber = data.order_number || ("WF-" + new Date().getTime());
    var customerName = data.customer_name || "ลูกค้า";
    var files = data.files || []; // อาร์เรย์ของ { name, type, mimeType, base64 }

    // 1. ค้นหาหรือสร้างโฟลเดอร์หลัก "Wadfan Studio Orders"
    var rootFolderName = "Wadfan Studio Orders";
    var rootFolders = DriveApp.getFoldersByName(rootFolderName);
    var rootFolder;
    if (rootFolders.hasNext()) {
      rootFolder = rootFolders.next();
    } else {
      rootFolder = DriveApp.createFolder(rootFolderName);
      rootFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }

    // 2. สร้างโฟลเดอร์ย่อยเฉพาะของออเดอร์นี้
    var orderFolderName = orderNumber + " - " + customerName;
    var orderFolder = rootFolder.createFolder(orderFolderName);
    orderFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var uploadedResults = [];

    // 3. บันทึกไฟล์ทั้งหมด (รูปภาพ + สลิปโอนเงิน) ลงในโฟลเดอร์
    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      if (!f || !f.base64) continue;

      var base64Data = f.base64;
      if (base64Data.indexOf(",") > -1) {
        base64Data = base64Data.split(",")[1];
      }

      var mimeType = f.mimeType || "image/png";
      var decoded = Utilities.base64Decode(base64Data);
      var blob = Utilities.newBlob(decoded, mimeType, f.name);
      var driveFile = orderFolder.createFile(blob);
      driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      uploadedResults.push({
        name: f.name,
        type: f.type || "customer_image", // 'slip' หรือ 'customer_image'
        fileId: driveFile.getId(),
        viewUrl: driveFile.getUrl(),
        downloadUrl: "https://drive.google.com/uc?export=view&id=" + driveFile.getId()
      });
    }

    var result = {
      success: true,
      order_number: orderNumber,
      folder_name: orderFolderName,
      folder_url: orderFolder.getUrl(),
      files: uploadedResults
    };

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "ok",
    service: "Wadfan Studio Google Drive Uploader Ready"
  })).setMimeType(ContentService.MimeType.JSON);
}
