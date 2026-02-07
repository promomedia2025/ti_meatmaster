import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";

// Helper functions
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

// Prevent word breaking by replacing spaces with non-breaking spaces in critical words
const preventWordBreak = (text: string): string => {
  if (!text) return text;
  // Replace spaces within words with non-breaking spaces
  // This prevents words like "Σύνολο" from breaking into "Συνολ" and "ο"
  return text.replace(/(\S+)\s+(\S+)/g, (match, word1, word2) => {
    // For Greek words and short phrases, use non-breaking spaces
    // Check if it's a short phrase (less than 20 chars) or contains Greek
    if (match.length < 20 || /[\u0370-\u03FF]/.test(match)) {
      return `${word1}\u00A0${word2}`;
    }
    return match;
  });
};

// Protect specific important words/phrases from breaking
const protectWords = (text: string): string => {
  if (!text) return text;
  // Protect common invoice terms
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

// Load Roboto fonts
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order, paperSize = "A4" } = body;

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order data is required" },
        { status: 400 }
      );
    }

    console.log("📄 [PDF] Building invoice for order:", {
      orderId: order.order_id,
      orderType: order.order_type,
      payment: order.payment,
      hasMenus: !!order.order_menus,
      menuCount: order.order_menus?.length || 0,
      paperSize: paperSize,
    });

    const isThermal = paperSize === "80mm" || paperSize === "58mm";
    const is80mm = paperSize === "80mm";
    const is58mm = paperSize === "58mm";
    
    // Convert mm to points (1mm = 2.83465 points)
    // For thermal printers, width is fixed, height will be dynamic
    const thermalWidth = is80mm ? 226.77 : is58mm ? 198.33 : 226.77;
    
    // Load fonts - MUST have Roboto fonts for pdfkit to work in Next.js
    const fonts = loadFonts();
    if (!fonts.normal) {
      return NextResponse.json(
        { success: false, error: "Roboto fonts not found. Please ensure fonts are in public/fonts/static/" },
        { status: 500 }
      );
    }
    
    const fontFamily = "Roboto";
    
    // Base font size based on paper size (increased for better readability)
    let baseFontSize = Math.round((is58mm ? 7 : is80mm ? 8 : paperSize === "A5" ? 9 : 10) * 1.4);
    let titleFontSize = Math.round((is58mm ? 10 : is80mm ? 12 : paperSize === "A5" ? 14 : 16) * 1.4);
    let headerFontSize = Math.round((is58mm ? 8 : is80mm ? 10 : paperSize === "A5" ? 11 : 12) * 1.4);
    
    const pagePadding = isThermal ? (is58mm ? 10 : 12) : 45; // Slightly increased for harmony
    let lineHeight = baseFontSize * 1.3; // Increased for better readability with larger fonts
    let sectionSpacing = isThermal ? (is58mm ? 12 : 14) : 16; // Increased proportionally to font sizes
    let rowSpacing = isThermal ? (is58mm ? 4 : 5) : 6; // Increased proportionally
    
    // Measure content height for ALL paper sizes to ensure single page
    let calculatedHeight = 2000; // Default large height
    let calculatedWidth: number | string = paperSize === "A5" ? 420 : 595; // A5 or A4 width in points
    
    // Always measure content height to ensure single page
    {
      // Create a measurement document to calculate exact height
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
      
      // Register fonts IMMEDIATELY after document creation
      // Register each font variant separately to avoid variable font detection
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
      
      // Set font immediately to prevent Helvetica initialization
      measureDoc.font("Roboto");
      
      let measureY = measureDoc.page.margins.top;
      const textWidth = measureDoc.page.width - measureDoc.page.margins.left - measureDoc.page.margins.right;
      
      // Measure title
      measureY += measureDoc.heightOfString(`Παραγγελία #${sanitizeString(order.order_id)}`, { width: textWidth }) + sectionSpacing;
      
      // Measure customer info (left column) and order info (right column)
      // Use actual text measurement to account for wrapping
      const leftColumnWidth = textWidth / 2;
      const leftColumnHeight = (() => {
        let h = lineHeight; // "Πελάτης" label
        // Measure actual customer name height (may wrap)
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
          h += rowSpacing + lineHeight; // "Διεύθυνση Παράδοσης" label
          // Measure actual address height (may wrap to multiple lines)
          const addressText = sanitizeString(order.location_name) || "N/A";
          h += measureDoc.heightOfString(addressText, { 
            width: leftColumnWidth
          });
          // Floor and bell are single-line, use lineHeight
          if (order.floor) {
            h += lineHeight;
          }
          if (order.bell_name) {
            h += lineHeight;
          }
        }
        return h;
      })();
      
      // Right column: Payment, Order Type, Date (these are short, unlikely to wrap)
      const rightColumnHeight = lineHeight + lineHeight + // Payment label + value
                                 lineHeight * 1.4 + // spacing
                                 lineHeight + lineHeight + // Order Type label + value
                                 lineHeight * 1.4 + // spacing
                                 25 + // Extra spacing before "Ημερομηνία"
                                 lineHeight + lineHeight; // Date label + value
      measureY += Math.max(leftColumnHeight, rightColumnHeight) + sectionSpacing;
      
      // Push order items section 25px down
      measureY += 45;
      
      // Measure items table
      measureY += lineHeight + rowSpacing; // "Προϊόντα" header
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
          measureY += Math.max(rowHeight, lineHeight) + 10; // Fixed 10px spacing between items
        });
      }
      
      measureY += sectionSpacing;
      
      // Measure comment - moved above totals
      if (order.comment) {
        measureY += lineHeight; // "Σχόλιο" label
        measureY += measureDoc.heightOfString(sanitizeString(order.comment), { width: textWidth });
        measureY += sectionSpacing; // Spacing after comment before totals
      }
      
      // Measure totals - right below order items (or comment if present)
      measureY += lineHeight + rowSpacing; // "Σύνοψη Παραγγελίας" header
      if (order.order_totals && order.order_totals.length > 0) {
        measureY += lineHeight * order.order_totals.length;
      } else {
        measureY += lineHeight;
      }
      
      calculatedHeight = measureY + pagePadding;
      // Ensure minimum height
      if (calculatedHeight < 100) calculatedHeight = 100;
      
      // Maximum height: A4 paper (842 points) for all sizes
      const maxHeight = 842;
      let scaleFactor = 1.0;
      if (calculatedHeight > maxHeight) {
        scaleFactor = maxHeight / calculatedHeight;
        // Adjust font sizes proportionally to fit comfortably
        baseFontSize = Math.max(7, Math.round(baseFontSize * scaleFactor));
        titleFontSize = Math.max(10, Math.round(titleFontSize * scaleFactor));
        headerFontSize = Math.max(8, Math.round(headerFontSize * scaleFactor));
        // Recalculate lineHeight and spacing with new font sizes
        lineHeight = baseFontSize * 1.3; // Increased for harmony with larger fonts
        sectionSpacing = Math.max(10, Math.round(sectionSpacing * scaleFactor));
        rowSpacing = Math.max(4, Math.round(rowSpacing * scaleFactor));
        
        // Re-measure with scaled fonts to get accurate height
        // This ensures the page height matches the actual scaled content
        let remeasureY = measureDoc.page.margins.top;
        remeasureY += measureDoc.heightOfString(`Παραγγελία #${sanitizeString(order.order_id)}`, { width: textWidth }) + sectionSpacing;
        
        // Re-measure customer info with actual text measurement
        const remeasureLeftWidth = textWidth / 2;
        const remeasureLeftHeight = (() => {
          let h = lineHeight; // "Πελάτης" label
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
            h += rowSpacing + lineHeight; // "Διεύθυνση Παράδοσης" label
          const addressText = sanitizeString(order.location_name) || "N/A";
          h += measureDoc.heightOfString(addressText, { 
            width: remeasureLeftWidth
          });
          // Floor and bell are single-line, use lineHeight
          if (order.floor) {
            h += lineHeight;
          }
          if (order.bell_name) {
            h += lineHeight;
          }
          }
          return h;
        })();
        const remeasureRightHeight = lineHeight + lineHeight + // Payment
                                      lineHeight * 1.4 + // spacing
                                      lineHeight + lineHeight + // Order Type
                                      lineHeight * 1.4 + // spacing
                                      25 + // Extra spacing before "Ημερομηνία"
                                      lineHeight + lineHeight; // Date
        remeasureY += Math.max(remeasureLeftHeight, remeasureRightHeight) + sectionSpacing;
        
        // Push order items section 25px down
        remeasureY += 25;
        
        // Re-measure items
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
            remeasureY += Math.max(rowHeight, lineHeight) + 10; // Fixed 10px spacing between items
          });
        }
        
        remeasureY += sectionSpacing;
        
        // Re-measure comment - moved above totals
        if (order.comment) {
          remeasureY += lineHeight; // "Σχόλιο" label
          remeasureY += measureDoc.heightOfString(sanitizeString(order.comment), { width: textWidth });
          remeasureY += sectionSpacing; // Spacing after comment before totals
        }
        
        // Re-measure totals - right below order items (or comment if present)
        remeasureY += lineHeight + rowSpacing;
        if (order.order_totals && order.order_totals.length > 0) {
          remeasureY += lineHeight * order.order_totals.length;
        } else {
          remeasureY += lineHeight;
        }
        
        // Use the re-measured height (with scaled fonts) but cap at maxHeight
        // Add buffer to ensure totals section is never cut off
        calculatedHeight = Math.min(maxHeight, remeasureY + pagePadding + 20); // 20px buffer for safety
      } else {
        // Use measured height with buffer to ensure nothing gets cut off
        calculatedHeight = measureY + pagePadding + 20; // 20px buffer for safety
        if (calculatedHeight > maxHeight) {
          calculatedHeight = maxHeight;
        }
      }
      
      // Set calculated width
      if (!isThermal) {
        calculatedWidth = paperSize === "A5" ? 420 : 595;
      } else {
        calculatedWidth = thermalWidth;
      }
    }
    
    // Create PDF document with calculated height to ensure single page
    // Ensure portrait orientation: width < height (portrait is default in pdfkit)
    // Disable automatic page creation to ensure single page
    // Use calculated height directly (already includes minimal buffer) to eliminate dead space
    const pageHeightWithBuffer = Math.min(842, calculatedHeight);
    const pageSize: [number, number] = isThermal 
      ? [thermalWidth, pageHeightWithBuffer] // Thermal: width is small, height is large (portrait)
      : [calculatedWidth, pageHeightWithBuffer]; // Standard: width < height ensures portrait
    
    // Ensure portrait orientation (height >= width) - swap if accidentally landscape
    if (pageSize[0] > pageSize[1]) {
      pageSize.reverse();
    }
    
    const doc = new PDFDocument({
      size: pageSize, // Portrait orientation is ensured by width < height
      margins: {
        top: pagePadding,
        bottom: pagePadding,
        left: pagePadding,
        right: pagePadding,
      },
      autoFirstPage: true,
      bufferPages: false, // Disable page buffering to prevent multiple pages
    });

    // Register fonts IMMEDIATELY after document creation to prevent Helvetica initialization
    // Register each font variant separately to avoid variable font detection
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
    
    // Set font immediately to prevent Helvetica initialization
    doc.font("Roboto");
    
    // Prevent automatic page creation - ensure single page only
    const originalAddPage = doc.addPage.bind(doc);
    doc.addPage = function() {
      // Prevent adding new pages - we want only one page
      console.warn("⚠️ [PDF] Attempted to add new page, but single-page mode is enforced");
      return this;
    };
    
    // Track Y position
    let y = doc.page.margins.top;

    // Helper to add text with wrapping
    const addText = (
      text: string,
      options: {
        fontSize?: number;
        bold?: boolean;
        italic?: boolean;
        align?: "left" | "center" | "right";
        marginBottom?: number;
      } = {}
    ) => {
      const {
        fontSize = baseFontSize,
        bold = false,
        italic = false,
        align = "left",
        marginBottom = rowSpacing,
      } = options;

      doc.font("Roboto")
        .fontSize(fontSize)
        .fillColor("#000000");

      if (bold && fonts.bold) {
        doc.font("Roboto-Bold");
      } else if (italic && fonts.italic) {
        doc.font("Roboto-Italic");
      } else {
        doc.font("Roboto");
      }

      const textWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const textY = y;
      
      doc.text(text, doc.page.margins.left, textY, {
        width: textWidth,
        align: align,
        lineGap: 2,
      });

      // Calculate actual height used
      const height = doc.heightOfString(text, {
        width: textWidth,
        lineGap: 2,
      });

      y += height + marginBottom;
      return y;
    };

    // Title
    const titleText = protectWords(`Παραγγελία #${sanitizeString(order.order_id)}`);
    doc.font(fonts.bold ? "Roboto-Bold" : "Roboto")
      .fontSize(titleFontSize)
      .fillColor("#000000")
      .text(titleText, doc.page.margins.left, y, {
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
      });
    y += doc.heightOfString(`Παραγγελία #${sanitizeString(order.order_id)}`, {
      width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
    }) + sectionSpacing;

    // Customer and Order Info
    const isDelivery =
      order.order_type === "delivery" ||
      order.order_type === "Delivery" ||
      order.order_type === "DELIVERY";

    // Left column: Customer info
    const leftColumnWidth = (doc.page.width - doc.page.margins.left - doc.page.margins.right) / 2;
    
    doc.font(fonts.bold ? "Roboto-Bold" : "Roboto")
      .fontSize(headerFontSize)
      .text(protectWords("Πελάτης"), doc.page.margins.left, y);
    y += lineHeight;

    // Customer name with proper wrapping
    const customerNameHeight = doc.heightOfString(sanitizeString(order.customer_name) || "N/A", { 
      width: leftColumnWidth, 
      lineGap: 2 
    });
    doc.font("Roboto")
      .fontSize(baseFontSize)
      .text(sanitizeString(order.customer_name) || "N/A", doc.page.margins.left, y, {
        width: leftColumnWidth,
        lineGap: 2,
      });
    y += customerNameHeight;

    if (order.telephone) {
      const telHeight = doc.heightOfString(sanitizeString(order.telephone), { 
        width: leftColumnWidth, 
        lineGap: 2 
      });
      doc.text(sanitizeString(order.telephone), doc.page.margins.left, y, {
        width: leftColumnWidth,
        lineGap: 2,
      });
      y += telHeight;
    }

    if (isDelivery) {
      y += rowSpacing; // Spacing before delivery address section
      doc.font(fonts.bold ? "Roboto-Bold" : "Roboto")
        .fontSize(headerFontSize)
        .text(protectWords("Διεύθυνση Παράδοσης"), doc.page.margins.left, y);
      y += lineHeight;

      // Address with proper wrapping to prevent crowding
      const addressText = sanitizeString(order.location_name) || "N/A";
      const addressHeight = 15;
      doc.font("Roboto")
        .fontSize(baseFontSize)
        .text(addressText, doc.page.margins.left, y, {
          width: 250,
        });
      y += addressHeight;

      // Floor and bell are single-line fields, use lineHeight for consistent spacing
      if (order.floor) {
        doc.text(`Όροφος: ${sanitizeString(order.floor)}`, doc.page.margins.left, y);
        y += lineHeight;
      }

      if (order.bell_name) {
        doc.text(`Κουδούνι: ${sanitizeString(order.bell_name)}`, doc.page.margins.left, y);
        y += lineHeight;
      }
    }

    // Right column: Payment and order info
    const rightColumnX = doc.page.margins.left + leftColumnWidth;
    let rightY = doc.page.margins.top + sectionSpacing + lineHeight; // Start after title

    doc.font(fonts.bold ? "Roboto-Bold" : "Roboto")
      .fontSize(headerFontSize)
      .text(protectWords("Πληρωμή"), rightColumnX, rightY, { align: "right" });
    rightY += lineHeight;

    doc.font("Roboto")
      .fontSize(baseFontSize)
      .text(getPaymentMethodName(order.payment), rightColumnX, rightY, { align: "right" });
    rightY += lineHeight * 1.4; // Harmonious spacing between sections
    
    // Move "Τύπος παραγγελίας" slightly left to prevent line breaking
    const orderTypeX = rightColumnX - (isThermal ? 10 : 15);
    doc.font(fonts.bold ? "Roboto-Bold" : "Roboto")
      .fontSize(12)
      .text(protectWords("Τύπος παραγγελίας:"), orderTypeX, rightY, { align: "right" });
    rightY += lineHeight;

    doc.font("Roboto")
      .fontSize(16)
      .text(getOrderTypeName(order.order_type), orderTypeX, rightY, { align: "right"});
    rightY += lineHeight * 1.4; // Harmonious spacing between sections
    
    // Push "Ημερομηνία" down for better visual balance
    rightY += 48;

    doc.font(fonts.bold ? "Roboto-Bold" : "Roboto")
      .fontSize(headerFontSize)
      .text(protectWords("Ημερομηνία"), rightColumnX, rightY, { align: "right" });
    rightY += lineHeight;

    doc.font("Roboto")
      .fontSize(baseFontSize)
      .text(
        `${formatDate(order.order_date)} ${formatTime(order.order_time)}`,
        rightColumnX,
        rightY,
        { align: "right" }
      );

    // Use the maximum Y from both columns
    y = Math.max(y, rightY) + sectionSpacing;

    // Push order items section 25px down
    y += 25;

    // Table header
    const tableColWidths = {
      qty: isThermal ? 30 : 50,
      name: doc.page.width - doc.page.margins.left - doc.page.margins.right - (isThermal ? 80 : 120), // Reduced to give more space to price
      price: isThermal ? 50 : 70, // Increased to prevent "Σύνολο" from breaking
    };

    doc.font(fonts.bold ? "Roboto-Bold" : "Roboto")
      .fontSize(headerFontSize)
      .text("Ποσ.", doc.page.margins.left, y, { width: tableColWidths.qty, align: "center" });
    doc.text("Προϊόν", doc.page.margins.left + tableColWidths.qty, y, {
      width: tableColWidths.name,
    });
    // Position "Σύνολο" with more space and move it slightly left to prevent breaking
    const sumColumnX = doc.page.margins.left + tableColWidths.qty + tableColWidths.name;
    doc.text(protectWords("Σύνολο"), sumColumnX - (isThermal ? 5 : 10), y, {
      width: tableColWidths.price + (isThermal ? 10 : 20), // Extra width to prevent breaking
      align: "right",
    });
    y += lineHeight;

    // Table rows
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
        
        const fullText = [menuText, optionsText, commentText].filter(Boolean).join("\n");
        
        // Calculate height needed for this row
        const rowHeight = doc.heightOfString(fullText, {
          width: tableColWidths.name,
        });

        // Quantity
        doc.font("Roboto")
          .fontSize(baseFontSize)
          .text(
            String(menu.quantity || 0),
            doc.page.margins.left,
            y,
            { width: tableColWidths.qty, align: "center" }
          );

        // Product name (bold) - rendered first
        doc.font(fonts.bold ? "Roboto-Bold" : "Roboto")
          .fontSize(baseFontSize)
          .text(menuText, doc.page.margins.left + tableColWidths.qty, y, {
            width: tableColWidths.name,
          });

        // Calculate heights with correct font sizes to prevent overlap
        const menuTextHeight = doc.heightOfString(menuText, {
          width: tableColWidths.name,
        });
        
        const optionsFontSize = baseFontSize - (isThermal ? (is58mm ? 1.5 : 1) : 1);
        const optionsHeight = optionsText 
          ? doc.font("Roboto").fontSize(optionsFontSize).heightOfString(optionsText, { 
              width: tableColWidths.name 
            })
          : 0;
        
        const commentFontSize = baseFontSize - (isThermal ? (is58mm ? 1.5 : 1) : 1);
        const commentHeight = commentText
          ? doc.font(fonts.italic ? "Roboto-Italic" : "Roboto").fontSize(commentFontSize).heightOfString(commentText, { 
              width: tableColWidths.name 
            })
          : 0;

        // Options - rendered after menuText
        if (optionsText) {
          const optionsY = y + menuTextHeight;
          doc.font("Roboto")
            .fontSize(optionsFontSize)
            .text(optionsText, doc.page.margins.left + tableColWidths.qty, optionsY, {
              width: tableColWidths.name,
            });
        }

        // Comment - rendered after menuText and optionsText
        if (commentText) {
          const commentY = y + menuTextHeight + optionsHeight;
          doc.font(fonts.italic ? "Roboto-Italic" : "Roboto")
            .fontSize(commentFontSize)
            .text(commentText, doc.page.margins.left + tableColWidths.qty, commentY, {
              width: tableColWidths.name,
            });
        }
        // Price
        doc.font("Roboto")
          .fontSize(baseFontSize)
          .text(
            `${formatCurrency(menu.subtotal)} ${sanitizeString(order.currency) || "EUR"}`,
            doc.page.margins.left + tableColWidths.qty + tableColWidths.name,
            y,
            { width: tableColWidths.price, align: "right" }
          );

        y += Math.max(rowHeight, lineHeight) ; // Fixed 10px spacing between items
      });
    }

    y += sectionSpacing;

    // Comment - moved above totals section
    if (order.comment) {
      doc.font(fonts.bold ? "Roboto-Bold" : "Roboto")
        .fontSize(headerFontSize)
        .text(protectWords("Σχόλιο"), doc.page.margins.left, y);
      y += lineHeight;

      doc.font("Roboto")
        .fontSize(baseFontSize)
        .text(sanitizeString(order.comment), doc.page.margins.left, y, {
          width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
        });
      y += doc.heightOfString(sanitizeString(order.comment), {
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
      });
      
      y += sectionSpacing; // Spacing after comment before totals
    }

    // Totals - right below order items (or comment if present)
    doc.font(fonts.bold ? "Roboto-Bold" : "Roboto")
      .fontSize(headerFontSize)
      .text(protectWords("Σύνοψη Παραγγελίας"), doc.page.margins.left, y);
    y += lineHeight + rowSpacing;

    if (order.order_totals && order.order_totals.length > 0) {
      order.order_totals
        .sort((a: any, b: any) => a.priority - b.priority)
        .forEach((total: any) => {
          const isTotal = total.code === "total";
          const fontSize = isTotal ? baseFontSize + 1 : baseFontSize;

          doc.font(isTotal && fonts.bold ? "Roboto-Bold" : "Roboto")
            .fontSize(fontSize)
            .text(protectWords(sanitizeString(total.title)), doc.page.margins.left, y);

          doc.font(isTotal && fonts.bold ? "Roboto-Bold" : "Roboto")
            .fontSize(fontSize)
            .text(
              `${formatCurrency(total.value)} ${sanitizeString(order.currency) || "EUR"}`,
              doc.page.margins.left,
              y,
              { align: "right" }
            );

          y += lineHeight;
        });
    } else {
      doc.font("Roboto")
        .fontSize(baseFontSize)
        .text(protectWords("Σύνολο"), doc.page.margins.left, y);

      doc.font(fonts.bold ? "Roboto-Bold" : "Roboto")
        .fontSize(baseFontSize + 1)
        .text(
          `${formatCurrency(order.order_total || 0)} ${sanitizeString(order.currency) || "EUR"}`,
          doc.page.margins.left,
          y,
          { align: "right" }
        );

      y += lineHeight;
    }

    // Verify final Y position and ensure page height is sufficient
    // Add extra buffer to ensure totals section is never cut off
    const finalY = y + pagePadding;
    const currentPageHeight = doc.page.height;
    
    // Log for debugging (can be removed in production)
    console.log("📏 [PDF] Final measurements:", {
      finalY,
      currentPageHeight,
      calculatedHeight,
      pageHeightWithBuffer,
      hasTotals: !!(order.order_totals?.length || order.order_total),
    });
    
    // Finalize PDF
    doc.end();

    // Collect PDF buffer
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    
    return new Promise<NextResponse>((resolve, reject) => {
      doc.on("end", () => {
        // Convert Buffer chunks to Uint8Array
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
              "Content-Disposition": `attachment; filename="invoice-${order.order_id}.pdf"`,
            },
          })
        );
      });

      doc.on("error", (error) => {
        console.error("❌ [PDF] Error generating PDF:", error);
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
    console.error("❌ [PDF] Error generating PDF:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate PDF",
      },
      { status: 500 }
    );
  }
}