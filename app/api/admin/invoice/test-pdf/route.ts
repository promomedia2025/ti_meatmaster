import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";

// Helper functions (same as in the main invoice route)
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("el-GR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (error) {
    return dateString;
  }
};

const formatTime = (timeString: string | null | undefined) => {
  return timeString || "";
};

const formatCurrency = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return "0.00";
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numValue)) return "0.00";
  return numValue.toFixed(2);
};

const getPaymentMethodName = (payment?: string | null) => {
  if (!payment) return "";
  return payment === "cod" ? "Μετρητά" : "Κάρτα";
};

const getOrderTypeName = (orderType?: string | null) => {
  if (!orderType || typeof orderType !== "string") return "N/A";
  const type = orderType;
  if (type === "delivery" || type === "Delivery" || type === "DELIVERY") {
    return "Delivery";
  }
  if (
    type === "collection" ||
    type === "Collection" ||
    type === "COLLECTION" ||
    type === "pickup" ||
    type === "Pickup" ||
    type === "PICKUP"
  ) {
    return "Takeaway";
  }
  return type;
};

const sanitizeString = (value: any): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  return String(value);
};

const preventWordBreak = (text: string): string => {
  if (!text) return text;
  return text.replace(/(\S+)\s+(\S+)/g, (match, word1, word2) => {
    if (match.length < 20 || /[\u0370-\u03FF]/.test(match)) {
      return `${word1}\u00A0${word2}`;
    }
    return match;
  });
};

const protectWords = (text: string): string => {
  if (!text) return text;
  const protectedTerms: { [key: string]: string } = {
    "Σύνολο": "Σύνολο",
    "Σύνοψη Παραγγελίας": "Σύνοψη\u00A0Παραγγελίας",
    "Παραγγελία #": "Παραγγελία\u00A0#",
    "Πελάτης": "Πελάτης",
    "Πληρωμή": "Πληρωμή",
    "Ημερομηνία": "Ημερομηνία",
    "Διεύθυνση Παράδοσης": "Διεύθυνση\u00A0Παράδοσης",
    "Τύπος παραγγελίας": "Τύπος\u00A0παραγγελίας",
  };
  
  let result = text;
  for (const [term, replacement] of Object.entries(protectedTerms)) {
    result = result.replace(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
  }
  return result;
};

const loadFonts = () => {
  const basePath = process.cwd();
  const staticFontBase = path.join(basePath, "public", "fonts", "static");
  
  const fonts: {
    normal?: string;
    bold?: string;
    italic?: string;
    boldItalic?: string;
  } = {};
  
  const normalPath = path.join(staticFontBase, "Roboto-Regular.ttf");
  const boldPath = path.join(staticFontBase, "Roboto-Medium.ttf");
  const italicPath = path.join(staticFontBase, "Roboto-Italic.ttf");
  const boldItalicPath = path.join(staticFontBase, "Roboto-MediumItalic.ttf");
  
  if (fs.existsSync(normalPath)) fonts.normal = normalPath;
  if (fs.existsSync(boldPath)) fonts.bold = boldPath;
  if (fs.existsSync(italicPath)) fonts.italic = italicPath;
  if (fs.existsSync(boldItalicPath)) fonts.boldItalic = boldItalicPath;
  
  return fonts;
};

// Sample order data for test print
const createSampleOrder = () => {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);
  
  return {
    order_id: "TEST-001",
    customer_name: "Δοκιμαστικός Πελάτης",
    telephone: "2101234567",
    order_type: "delivery",
    payment: "cod",
    order_date: dateStr,
    order_time: timeStr,
    location_name: "Οδός Παράδειγμα 123, Αθήνα 10431",
    floor: "3ος",
    bell_name: "ΓΙΑΝΝΗΣ",
    comments: "Παρακαλώ αφήστε το μπροστά στην πόρτα",
    comment: "Αυτή είναι μια δοκιμαστική παραγγελία για έλεγχο εκτύπωσης",
    currency: "EUR",
    order_menus: [
      {
        name: "Μπέργκερ Κλασικό",
        quantity: 2,
        subtotal: "15.00",
        comment: "Χωρίς κρεμμύδια",
        menu_options: [
          {
            order_option_name: "Μεγάλο",
            quantity: 1,
            order_option_price: "2.00",
          },
          {
            order_option_name: "Πατάτες",
            quantity: 1,
            order_option_price: "3.50",
          },
        ],
      },
      {
        name: "Πίτσα Μαργαρίτα",
        quantity: 1,
        subtotal: "12.50",
        menu_options: [
          {
            order_option_name: "Μεγάλη",
            quantity: 1,
            order_option_price: "2.50",
          },
        ],
      },
      {
        name: "Κοκα-Κόλα",
        quantity: 2,
        subtotal: "4.00",
        menu_options: [],
      },
    ],
    order_totals: [
      {
        code: "subtotal",
        title: "Υποσύνολο",
        value: "31.50",
        priority: 1,
      },
      {
        code: "delivery",
        title: "Κόστος Παράδοσης",
        value: "3.00",
        priority: 2,
      },
      {
        code: "total",
        title: "Σύνολο",
        value: "34.50",
        priority: 3,
      },
    ],
    order_total: "34.50",
    tip_amount: "2.00",
  };
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paperSize = "A4" } = body;

    // Create sample order data
    const order = createSampleOrder();

    console.log("📄 [TEST PDF] Building test invoice with paper size:", paperSize);

    const isThermal = paperSize === "80mm" || paperSize === "58mm";
    const is80mm = paperSize === "80mm";
    const is58mm = paperSize === "58mm";
    const isA5 = paperSize === "A5";
    
    const thermalWidth = is80mm ? 226.77 : is58mm ? 198.33 : 226.77;
    
    const fonts = loadFonts();
    if (!fonts.normal) {
      return NextResponse.json(
        { success: false, error: "Roboto fonts not found. Please ensure fonts are in public/fonts/static/" },
        { status: 500 }
      );
    }
    
    const fontFamily = "Roboto";
    
    let baseFontSize = Math.round((is58mm ? 7 : is80mm ? 8 : paperSize === "A5" ? 9 : 10) * 1.4);
    let titleFontSize = Math.round((is58mm ? 10 : is80mm ? 12 : paperSize === "A5" ? 14 : 16) * 1.4);
    let headerFontSize = Math.round((is58mm ? 8 : is80mm ? 10 : paperSize === "A5" ? 11 : 12) * 1.4);
    
    const pagePadding = isThermal ? (is58mm ? 10 : 12) : 45;
    let lineHeight = baseFontSize * 1.3;
    let sectionSpacing = isThermal ? (is58mm ? 12 : 14) : 16;
    let rowSpacing = isThermal ? (is58mm ? 4 : 5) : 6;
    
    // Measure content height (same logic as main invoice route)
    let calculatedHeight = 2000;
    let calculatedWidth: number | string = paperSize === "A5" ? 420 : 595;
    
    {
      const measureWidth = isThermal ? thermalWidth : (paperSize === "A5" ? 420 : 595);
      const measureDoc = new PDFDocument({
        size: [measureWidth, 2000],
        margins: {
          top: pagePadding,
          bottom: pagePadding,
          left: pagePadding,
          right: pagePadding,
        },
      });
      
      if (fonts.normal) {
        measureDoc.registerFont("Roboto", fonts.normal);
      }
      if (fonts.bold) {
        measureDoc.registerFont("Roboto-Bold", fonts.bold);
      }
      if (fonts.italic) {
        measureDoc.registerFont("Roboto-Italic", fonts.italic);
      }
      if (fonts.boldItalic) {
        measureDoc.registerFont("Roboto-BoldItalic", fonts.boldItalic);
      }
      
      measureDoc.font("Roboto");
      
      let measureY = 0;
      const textWidth = measureDoc.page.width - measureDoc.page.margins.left - measureDoc.page.margins.right;
      
      const titleHeight = measureDoc.heightOfString(`Παραγγελία #${sanitizeString(order.order_id)}`, { width: textWidth });
      measureY += titleHeight + sectionSpacing;
      
      const leftColumnWidth = textWidth / 2;
      const leftColumnHeight = (() => {
        let h = lineHeight;
        h += measureDoc.heightOfString(sanitizeString(order.customer_name) || "N/A", { 
          width: leftColumnWidth, 
          lineGap: 2 
        });
        if (order.telephone) {
          h += measureDoc.heightOfString(sanitizeString(order.telephone), { 
            width: leftColumnWidth, 
            lineGap: 2 
          });
        }
        const isDelivery = order.order_type === "delivery" || order.order_type === "Delivery" || order.order_type === "DELIVERY";
        if (isDelivery) {
          h += rowSpacing + lineHeight;
          const addressText = sanitizeString(order.location_name) || "N/A";
          h += measureDoc.heightOfString(addressText, { 
            width: leftColumnWidth
          });
          if (order.floor) {
            h += lineHeight;
          }
          if (order.bell_name) {
            h += lineHeight;
          }
        }
        return h;
      })();
      
      const rightColumnHeight = lineHeight + lineHeight +
                                 lineHeight * 1.4 +
                                 lineHeight + lineHeight +
                                 lineHeight * 1.4 +
                                 25 +
                                 lineHeight + lineHeight;
      const customerInfoHeight = Math.max(leftColumnHeight, rightColumnHeight) + sectionSpacing;
      measureY += customerInfoHeight;
      
      measureY += 45;
      
      const itemsHeaderHeight = lineHeight + rowSpacing;
      measureY += itemsHeaderHeight;
      
      let itemsTotalHeight = 0;
      if (order.order_menus && order.order_menus.length > 0) {
        order.order_menus.forEach((menu: any) => {
          const options: string[] = [];
          if (menu.menu_options && menu.menu_options.length > 0) {
            menu.menu_options.forEach((option: any) => {
              const quantity = option.quantity > 1 ? `${option.quantity} × ` : "";
              const price = option.order_option_price && parseFloat(option.order_option_price) > 0
                ? ` (${formatCurrency(option.order_option_price)}€)`
                : "";
              options.push(`• ${quantity}${sanitizeString(option.order_option_name || option.name)}${price}`);
            });
          }
          
          const menuText = sanitizeString(menu.name);
          const commentText = menu.comment ? sanitizeString(menu.comment) : "";
          const optionsText = options.length > 0 ? options.join("\n") : "";
          const fullText = [menuText, optionsText, commentText].filter(Boolean).join("\n");
          
          const rowHeight = measureDoc.heightOfString(fullText, { width: textWidth * 0.6, lineGap: 2 });
          const itemRowHeight = Math.max(rowHeight, lineHeight) + 10;
          itemsTotalHeight += itemRowHeight;
          measureY += itemRowHeight;
        });
      }
      
      measureY += sectionSpacing;
      
      let commentHeight = 0;
      if (order.comment) {
        commentHeight = lineHeight;
        commentHeight += measureDoc.heightOfString(sanitizeString(order.comment), { width: textWidth });
        commentHeight += sectionSpacing;
        measureY += commentHeight;
      }
      
      const totalsHeaderHeight = lineHeight + rowSpacing;
      measureY += totalsHeaderHeight;
      let totalsRowsCount = order.order_totals && order.order_totals.length > 0
        ? order.order_totals.length
        : 1;
      if (order.tip_amount !== null && order.tip_amount !== undefined && parseFloat(String(order.tip_amount)) > 0) {
        totalsRowsCount += 1;
      }
      const totalsRowsHeight = lineHeight * totalsRowsCount;
      measureY += totalsRowsHeight;
      
      // Add thank you message height
      measureY += rowSpacing + lineHeight; // Spacing + thank you message
      
      calculatedHeight = measureY + pagePadding + 10;
      if (calculatedHeight < 100) calculatedHeight = 100;
      
      const maxHeight = 842;
      let scaleFactor = 1.0;
      if (calculatedHeight > maxHeight) {
        scaleFactor = maxHeight / calculatedHeight;
        baseFontSize = Math.max(7, Math.round(baseFontSize * scaleFactor));
        titleFontSize = Math.max(10, Math.round(titleFontSize * scaleFactor));
        headerFontSize = Math.max(8, Math.round(headerFontSize * scaleFactor));
        lineHeight = baseFontSize * 1.3;
        sectionSpacing = Math.max(10, Math.round(sectionSpacing * scaleFactor));
        rowSpacing = Math.max(4, Math.round(rowSpacing * scaleFactor));
        
        let remeasureY = 0;
        remeasureY += measureDoc.heightOfString(`Παραγγελία #${sanitizeString(order.order_id)}`, { width: textWidth }) + sectionSpacing;
        
        const remeasureLeftWidth = textWidth / 2;
        const remeasureLeftHeight = (() => {
          let h = lineHeight;
          h += measureDoc.heightOfString(sanitizeString(order.customer_name) || "N/A", { 
            width: remeasureLeftWidth, 
            lineGap: 2 
          });
          if (order.telephone) {
            h += measureDoc.heightOfString(sanitizeString(order.telephone), { 
              width: remeasureLeftWidth, 
              lineGap: 2 
            });
          }
          const isDelivery = order.order_type === "delivery" || order.order_type === "Delivery" || order.order_type === "DELIVERY";
          if (isDelivery) {
            h += rowSpacing + lineHeight;
            const addressText = sanitizeString(order.location_name) || "N/A";
            h += measureDoc.heightOfString(addressText, { 
              width: remeasureLeftWidth
            });
            if (order.floor) {
              h += lineHeight;
            }
            if (order.bell_name) {
              h += lineHeight;
            }
          }
          return h;
        })();
        const remeasureRightHeight = lineHeight + lineHeight +
                                      lineHeight * 1.4 +
                                      lineHeight + lineHeight +
                                      lineHeight * 1.4 +
                                      25 +
                                      lineHeight + lineHeight;
        remeasureY += Math.max(remeasureLeftHeight, remeasureRightHeight) + sectionSpacing;
        
        remeasureY += 25;
        
        remeasureY += lineHeight + rowSpacing;
        if (order.order_menus && order.order_menus.length > 0) {
          order.order_menus.forEach((menu: any) => {
            const options: string[] = [];
            if (menu.menu_options && menu.menu_options.length > 0) {
              menu.menu_options.forEach((option: any) => {
                const quantity = option.quantity > 1 ? `${option.quantity} × ` : "";
                const price = option.order_option_price && parseFloat(option.order_option_price) > 0
                  ? ` (${formatCurrency(option.order_option_price)}€)`
                  : "";
                options.push(`• ${quantity}${sanitizeString(option.order_option_name || option.name)}${price}`);
              });
            }
            const menuText = sanitizeString(menu.name);
            const commentText = menu.comment ? sanitizeString(menu.comment) : "";
            const optionsText = options.length > 0 ? options.join("\n") : "";
            const fullText = [menuText, optionsText, commentText].filter(Boolean).join("\n");
            const rowHeight = measureDoc.heightOfString(fullText, { width: textWidth * 0.6, lineGap: 2 });
            remeasureY += Math.max(rowHeight, lineHeight) + 10;
          });
        }
        
        remeasureY += sectionSpacing;
        
        if (order.comment) {
          remeasureY += lineHeight;
          remeasureY += measureDoc.heightOfString(sanitizeString(order.comment), { width: textWidth });
          remeasureY += sectionSpacing;
        }
        
        remeasureY += lineHeight + rowSpacing;
        if (order.order_totals && order.order_totals.length > 0) {
          let totalsRowsCount = order.order_totals.length;
          if (order.tip_amount !== null && order.tip_amount !== undefined && parseFloat(String(order.tip_amount)) > 0) {
            totalsRowsCount += 1;
          }
          remeasureY += lineHeight * totalsRowsCount;
        } else {
          let totalsRowsCount = 1;
          if (order.tip_amount !== null && order.tip_amount !== undefined && parseFloat(String(order.tip_amount)) > 0) {
            totalsRowsCount += 1;
          }
          remeasureY += lineHeight * totalsRowsCount;
        }
        
        // Add thank you message height
        remeasureY += rowSpacing + lineHeight; // Spacing + thank you message
        
        calculatedHeight = Math.min(maxHeight, remeasureY + 10 + (isThermal ? 10 : 20)); // 10px top + small bottom padding
      } else {
        calculatedHeight = measureY + pagePadding + 10;
        if (calculatedHeight > maxHeight) {
          calculatedHeight = maxHeight;
        }
      }
      
      if (!isThermal) {
        calculatedWidth = paperSize === "A5" ? 420 : 595;
      } else {
        calculatedWidth = thermalWidth;
      }
    }
    
    let pageSize: [number, number];
    let contentWidth: number;
    let pageHeightWithBuffer: number;
    
    if (isThermal) {
      const thermalPageWidth = is80mm ? 226.77 : 164.41;
      const minPortraitHeight = thermalPageWidth;
      pageHeightWithBuffer = Math.max(minPortraitHeight, calculatedHeight);
      pageSize = [thermalPageWidth, pageHeightWithBuffer];
      contentWidth = thermalPageWidth;
    } else {
      const minPortraitHeight = isA5 ? 419.53 : 595.28;
      const maxHeight = isA5 ? 595.28 : 842;
      pageHeightWithBuffer = Math.max(minPortraitHeight, Math.min(maxHeight, calculatedHeight));
      const pageWidth = isA5 ? 419.53 : 595.28;
      pageSize = [pageWidth, pageHeightWithBuffer];
      contentWidth = pageWidth;
    }
    
    const doc = new PDFDocument({
      size: pageSize,
      margins: {
        top: isThermal ? 0 : pagePadding,
        bottom: isThermal ? 0 : pagePadding,
        left: 0,
        right: 0,
      },
      autoFirstPage: true,
      bufferPages: false,
    });

    if (fonts.normal) {
      doc.registerFont("Roboto", fonts.normal);
    }
    if (fonts.bold) {
      doc.registerFont("Roboto-Bold", fonts.bold);
    }
    if (fonts.italic) {
      doc.registerFont("Roboto-Italic", fonts.italic);
    }
    if (fonts.boldItalic) {
      doc.registerFont("Roboto-BoldItalic", fonts.boldItalic);
    }
    
    doc.font("Roboto");
    
    const originalAddPage = doc.addPage.bind(doc);
    doc.addPage = function() {
      console.warn("⚠️ [TEST PDF] Attempted to add new page, but single-page mode is enforced");
      return this;
    };
    
    const contentPadding = isThermal ? 0 : (isA5 ? 20 : 30);
    const contentX = contentPadding + 10;
    const availableContentWidth = contentWidth - (contentPadding * 2) - 10;
    
    let y = contentPadding + 10;

    // Title
    const titleText = protectWords(`Παραγγελία #${sanitizeString(order.order_id)}`);
    doc.font(fonts.bold ? "Roboto-Bold" : "Roboto")
      .fontSize(titleFontSize)
      .fillColor("#000000")
      .text(titleText, contentX, y, {
        width: availableContentWidth,
        align: "center",
      });
    y += doc.heightOfString(`Παραγγελία #${sanitizeString(order.order_id)}`, {
      width: availableContentWidth,
    }) + sectionSpacing;

    // Customer and Order Info
    const isDelivery =
      order.order_type === "delivery" ||
      order.order_type === "Delivery" ||
      order.order_type === "DELIVERY";

    const leftColumnWidth = isThermal ? availableContentWidth : (availableContentWidth / 2);
    const customerSectionStartY = y;
    
    doc.font(fonts.bold ? "Roboto-Bold" : "Roboto")
      .fontSize(headerFontSize)
      .text(protectWords("Πελάτης"), contentX, y);
    y += lineHeight;

    const customerNameHeight = doc.heightOfString(sanitizeString(order.customer_name) || "N/A", { 
      width: leftColumnWidth, 
      lineGap: 2 
    });
    doc.font("Roboto")
      .fontSize(baseFontSize)
      .text(sanitizeString(order.customer_name) || "N/A", contentX, y, {
        width: leftColumnWidth,
        lineGap: 2,
      });
    y += customerNameHeight;

    if (order.telephone) {
      const telHeight = doc.heightOfString(sanitizeString(order.telephone), { 
        width: leftColumnWidth, 
        lineGap: 2 
      });
      doc.text(sanitizeString(order.telephone), contentX, y, {
        width: leftColumnWidth,
        lineGap: 2,
      });
      y += telHeight;
    }

    if (isDelivery) {
      y += rowSpacing;
      doc.font(fonts.bold ? "Roboto-Bold" : "Roboto")
        .fontSize(headerFontSize)
        .text(protectWords("Διεύθυνση Παράδοσης"), contentX, y);
      y += lineHeight;

      const addressText = sanitizeString(order.location_name) || "N/A";
      doc.font("Roboto")
        .fontSize(baseFontSize)
        .text(addressText, contentX, y, {
          width: leftColumnWidth,
        });
      y += 15; // Move past the address text
      // Use lineHeight for consistent spacing (same as floor/bell/comments)

      // Floor - consistent spacing
      if (order.floor) {
        doc.text(`Όροφος: ${sanitizeString(order.floor)}`, contentX, y);
        y += lineHeight;
      }

      // Bell name - consistent spacing
      if (order.bell_name) {
        doc.text(`Κουδούνι: ${sanitizeString(order.bell_name)}`, contentX, y);
        y += lineHeight;
      }

      // Comments - consistent spacing
      if (order.comments) {
        const commentsText = sanitizeString(order.comments);
        const commentsHeight = doc.heightOfString(commentsText, { width: leftColumnWidth });
        doc.text(commentsText, contentX, y, {
          width: leftColumnWidth,
        });
        y += commentsHeight;
      }
    }

    if (isThermal) {
      y += rowSpacing;
      doc.font(fonts.bold ? "Roboto-Bold" : "Roboto")
        .fontSize(headerFontSize)
        .fillColor("#000000")
        .text(protectWords("Πληρωμή"), contentX, y);
      y += lineHeight;
      doc.font("Roboto")
        .fontSize(baseFontSize)
        .fillColor("#000000")
        .text(getPaymentMethodName(order.payment), contentX, y);
      y += 10;

      doc.font(fonts.bold ? "Roboto-Bold" : "Roboto")
        .fontSize(headerFontSize)
        .fillColor("#000000")
        .text(protectWords("Τύπος παραγγελίας"), contentX, y);
      y += lineHeight;
      doc.font("Roboto")
        .fontSize(baseFontSize)
        .fillColor("#000000")
        .text(getOrderTypeName(order.order_type), contentX, y);
      y += 10;

      doc.font(fonts.bold ? "Roboto-Bold" : "Roboto")
        .fontSize(headerFontSize)
        .fillColor("#000000")
        .text(protectWords("Ημερομηνία"), contentX, y);
      y += lineHeight;
      doc.font("Roboto")
        .fontSize(baseFontSize)
        .fillColor("#000000")
        .text(
          `${formatDate(order.order_date)} ${formatTime(order.order_time)}`,
          contentX,
          y
        );
      y += sectionSpacing;
    }

    if (!isThermal) {
      const rightColumnX = contentX + leftColumnWidth;
      const rightColumnWidth = leftColumnWidth;
      let rightY = customerSectionStartY;

      doc.font(fonts.bold ? "Roboto-Bold" : "Roboto")
        .fontSize(headerFontSize)
        .fillColor("#000000")
        .text(protectWords("Πληρωμή"), rightColumnX, rightY, { 
          width: rightColumnWidth,
          align: "right" 
        });
      rightY += lineHeight;

      doc.font("Roboto")
        .fontSize(baseFontSize)
        .fillColor("#000000")
        .text(getPaymentMethodName(order.payment), rightColumnX, rightY, { 
          width: rightColumnWidth,
          align: "right" 
        });
      rightY += lineHeight + 10;
      
      const orderTypeX = rightColumnX;
      doc.font(fonts.bold ? "Roboto-Bold" : "Roboto")
        .fontSize(12)
        .fillColor("#000000")
        .text(protectWords("Τύπος παραγγελίας:"), orderTypeX, rightY, { 
          width: rightColumnWidth,
          align: "right" 
        });
      rightY += lineHeight;

      doc.font("Roboto")
        .fontSize(16)
        .fillColor("#000000")
        .text(getOrderTypeName(order.order_type), orderTypeX, rightY, { 
          width: rightColumnWidth,
          align: "right"
        });
      rightY += lineHeight + 10;

      doc.font(fonts.bold ? "Roboto-Bold" : "Roboto")
        .fontSize(headerFontSize)
        .fillColor("#000000")
        .text(protectWords("Ημερομηνία"), rightColumnX, rightY, { 
          width: rightColumnWidth,
          align: "right" 
        });
      rightY += lineHeight;

      doc.font("Roboto")
        .fontSize(baseFontSize)
        .fillColor("#000000")
        .text(
          `${formatDate(order.order_date)} ${formatTime(order.order_time)}`,
          rightColumnX,
          rightY,
          { 
            width: rightColumnWidth,
            align: "right" 
          }
        );
      
      y = Math.max(y, rightY) + sectionSpacing;
    }

    y += 25;

    const priceColumnWidth = isThermal ? 65 : 70;
    const nameColumnReduction = isThermal ? 25 : 30;
    const tableColWidths = {
      qty: isThermal ? 30 : 50,
      name: availableContentWidth - (isThermal ? (30 + priceColumnWidth) : (50 + priceColumnWidth)) - nameColumnReduction,
      price: priceColumnWidth,
    };

    const totalTableWidth = tableColWidths.qty + tableColWidths.name + tableColWidths.price;
    if (totalTableWidth > availableContentWidth) {
      tableColWidths.name = availableContentWidth - tableColWidths.qty - tableColWidths.price;
    }

    doc.font(fonts.bold ? "Roboto-Bold" : "Roboto")
      .fontSize(headerFontSize)
      .text("Ποσ.", contentX, y, { width: tableColWidths.qty, align: "center" });
    doc.text("Προϊόν", contentX + tableColWidths.qty, y, {
      width: tableColWidths.name,
    });
    const sumColumnX = contentX + tableColWidths.qty + tableColWidths.name;
    doc.font(fonts.bold ? "Roboto-Bold" : "Roboto")
      .fontSize(headerFontSize)
      .text(protectWords("Σύνολο"), sumColumnX, y, {
        width: tableColWidths.price - 10,
        align: "right",
      });
    y += lineHeight;

    if (order.order_menus && order.order_menus.length > 0) {
      order.order_menus.forEach((menu: any) => {
        const options: string[] = [];
        if (menu.menu_options && menu.menu_options.length > 0) {
          menu.menu_options.forEach((option: any) => {
            const quantity =
              option.quantity > 1 ? `${option.quantity} × ` : "";
            const price =
              option.order_option_price &&
              parseFloat(option.order_option_price) > 0
                ? ` (${formatCurrency(option.order_option_price)}€)`
                : "";
            options.push(
              `• ${quantity}${sanitizeString(option.order_option_name || option.name)}${price}`
            );
          });
        }

        const menuText = sanitizeString(menu.name);
        const commentText = menu.comment ? sanitizeString(menu.comment) : "";
        const optionsText = options.length > 0 ? options.join("\n") : "";

        doc.font("Roboto")
          .fontSize(baseFontSize)
          .text(
            String(menu.quantity || 0),
            contentX,
            y,
            { width: tableColWidths.qty, align: "center" }
          );

        doc.font(fonts.bold ? "Roboto-Bold" : "Roboto")
          .fontSize(baseFontSize)
          .text(menuText, contentX + tableColWidths.qty, y, {
            width: tableColWidths.name,
          });

        const menuTextHeight = doc.heightOfString(menuText, {
          width: tableColWidths.name,
        });
        
        // Options can use more width since they're indented and don't need to align with price column
        // They can extend into the price column area (but leave some padding on the right)
        const optionsWidth = tableColWidths.name + tableColWidths.price - 15; // Use name + price width, minus 15px right padding
        
        const optionsFontSize = baseFontSize - (isThermal ? (is58mm ? 1.5 : 1) : 1);
        const optionsHeight = optionsText 
          ? doc.font("Roboto").fontSize(optionsFontSize).heightOfString(optionsText, { 
              width: optionsWidth 
            })
          : 0;
        
        const commentFontSize = baseFontSize - (isThermal ? (is58mm ? 1.5 : 1) : 1);
        const commentHeight = commentText
          ? doc.font(fonts.italic ? "Roboto-Italic" : "Roboto").fontSize(commentFontSize).heightOfString(commentText, { 
              width: optionsWidth 
            })
          : 0;

        // Options - rendered after menuText, can use wider width
        if (optionsText) {
          const optionsY = y + menuTextHeight;
          doc.font("Roboto")
            .fontSize(optionsFontSize)
            .text(optionsText, contentX + tableColWidths.qty, optionsY, {
              width: optionsWidth,
            });
        }

        // Comment - rendered after menuText and optionsText, can use wider width
        if (commentText) {
          const commentY = y + menuTextHeight + optionsHeight;
          doc.font(fonts.italic ? "Roboto-Italic" : "Roboto")
            .fontSize(commentFontSize)
            .text(commentText, contentX + tableColWidths.qty, commentY, {
              width: optionsWidth,
            });
        }
        const currencyDisplay = (sanitizeString(order.currency) || "EUR") === "EUR" ? "€" : sanitizeString(order.currency);
        doc.font("Roboto")
          .fontSize(baseFontSize)
          .text(
            `${formatCurrency(menu.subtotal)} ${currencyDisplay}`,
            contentX + tableColWidths.qty + tableColWidths.name,
            y,
            { width: tableColWidths.price - 10, align: "right" }
          );

        // Calculate actual height used by this item (sum of all components)
        const actualItemHeight = menuTextHeight + optionsHeight + commentHeight;
        // Use actual height with small spacing between items (5px)
        y += Math.max(actualItemHeight, lineHeight) + 5;
      });
    }

    y += sectionSpacing;

    if (order.comment) {
      doc.font(fonts.bold ? "Roboto-Bold" : "Roboto")
        .fontSize(headerFontSize)
        .text(protectWords("Σχόλιο"), contentX, y);
      y += lineHeight;

      doc.font("Roboto")
        .fontSize(baseFontSize)
        .text(sanitizeString(order.comment), contentX, y, {
          width: availableContentWidth,
        });
      y += doc.heightOfString(sanitizeString(order.comment), {
        width: availableContentWidth,
      });
      
      y += sectionSpacing;
    }

    const totalsPriceX = contentX + tableColWidths.qty + tableColWidths.name - 25;
    const totalsPriceWidth = tableColWidths.price + 25 - 10;
    
    doc.font(fonts.bold ? "Roboto-Bold" : "Roboto")
      .fontSize(headerFontSize)
      .text(protectWords("Σύνοψη Παραγγελίας"), contentX, y);
    y += lineHeight + rowSpacing;

    if (order.order_totals && order.order_totals.length > 0) {
      order.order_totals
        .sort((a: any, b: any) => a.priority - b.priority)
        .forEach((total: any) => {
          const isTotal = total.code === "total";
          const fontSize = isTotal ? baseFontSize + 1 : baseFontSize;

          doc.font(isTotal && fonts.bold ? "Roboto-Bold" : "Roboto")
            .fontSize(fontSize)
            .text(protectWords(sanitizeString(total.title)), contentX, y);

          const currencyDisplay = (sanitizeString(order.currency) || "EUR") === "EUR" ? "€" : sanitizeString(order.currency);
          doc.font(isTotal && fonts.bold ? "Roboto-Bold" : "Roboto")
            .fontSize(fontSize)
            .text(
              `${formatCurrency(total.value)} ${currencyDisplay}`,
              totalsPriceX,
              y,
              { width: totalsPriceWidth, align: "right" }
            );

          y += lineHeight;
        });
      
      if (order.tip_amount !== null && order.tip_amount !== undefined && parseFloat(String(order.tip_amount)) > 0) {
        const currencyDisplay = (sanitizeString(order.currency) || "EUR") === "EUR" ? "€" : sanitizeString(order.currency);
        doc.font("Roboto")
          .fontSize(baseFontSize)
          .text(protectWords("Φιλοδώρημα"), contentX, y);
        
        doc.font("Roboto")
          .fontSize(baseFontSize)
          .text(
            `${formatCurrency(order.tip_amount)} ${currencyDisplay}`,
            totalsPriceX,
            y,
            { width: totalsPriceWidth, align: "right" }
          );
        
        y += lineHeight;
      }
    } else {
      if (order.tip_amount !== null && order.tip_amount !== undefined && parseFloat(String(order.tip_amount)) > 0) {
        const currencyDisplay = (sanitizeString(order.currency) || "EUR") === "EUR" ? "€" : sanitizeString(order.currency);
        doc.font("Roboto")
          .fontSize(baseFontSize)
          .text(protectWords("Φιλοδώρημα"), contentX, y);
        
        doc.font("Roboto")
          .fontSize(baseFontSize)
          .text(
            `${formatCurrency(order.tip_amount)} ${currencyDisplay}`,
            totalsPriceX,
            y,
            { width: totalsPriceWidth, align: "right" }
          );
        
        y += lineHeight;
      }
      
      doc.font("Roboto")
        .fontSize(baseFontSize)
        .text(protectWords("Σύνολο"), contentX, y);

      const currencyDisplay = (sanitizeString(order.currency) || "EUR") === "EUR" ? "€" : sanitizeString(order.currency);
      doc.font(fonts.bold ? "Roboto-Bold" : "Roboto")
        .fontSize(baseFontSize + 1)
        .text(
          `${formatCurrency(order.order_total || 0)} ${currencyDisplay}`,
          totalsPriceX,
          y,
          { width: totalsPriceWidth, align: "right" }
        );

      y += lineHeight;
    }

    // Add thank you message at the bottom
    y += rowSpacing; // Add spacing before thank you message
    doc.font("Roboto")
      .fontSize(baseFontSize)
      .fillColor("#000000")
      .text(protectWords("Ευχαριστούμε για την παραγγελία σας"), contentX, y, {
        width: availableContentWidth,
        align: "center",
      });
    y += lineHeight;

    doc.end();

    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    
    return new Promise<NextResponse>((resolve, reject) => {
      doc.on("end", () => {
        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const pdfArray = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
          pdfArray.set(new Uint8Array(chunk), offset);
          offset += chunk.length;
        }
        
        resolve(
          new NextResponse(pdfArray, {
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": `attachment; filename="test-invoice.pdf"`,
            },
          })
        );
      });

      doc.on("error", (error) => {
        console.error("❌ [TEST PDF] Error generating PDF:", error);
        reject(
          NextResponse.json(
            {
              success: false,
              error: error instanceof Error ? error.message : "Failed to generate PDF",
            },
            { status: 500 }
          )
        );
      });
    });
  } catch (error) {
    console.error("❌ [TEST PDF] Error generating PDF:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate PDF",
      },
      { status: 500 }
    );
  }
}
