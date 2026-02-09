"use client";

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

interface OrderMenu {
  order_menu_id: number;
  order_id: number;
  menu_id: number;
  name: string;
  quantity: number;
  price: string;
  subtotal: string;
  comment: string;
  menu_options: any[];
}

interface OrderTotal {
  order_total_id: number;
  order_id: number;
  code: string;
  title: string;
  value: string;
  priority: number;
  is_summable: number;
}

interface AdminOrder {
  order_id: number;
  order_date: string;
  order_time: string;
  order_total: string;
  currency: string;
  status_id: number;
  created_at: string;
  location_name: string;
  status_name: string;
  order_menus: OrderMenu[];
  order_totals: OrderTotal[];
  customer_name?: string;
  customer_id?: number;
  telephone?: string;
  email?: string;
  payment?: string;
  order_type?: string;
  order_type_name?: string;
  comment?: string;
  total_items?: number;
  bell_name?: string | null;
  floor?: string | null;
  address_id?: number | null;
}

interface InvoicePDFProps {
  order: AdminOrder;
  paperSize: string;
}

// Helper functions
const formatDateTime = (dateString: string, timeString: string) => {
  const date = new Date(dateString);
  const [hours, minutes] = timeString.split(":");
  date.setHours(parseInt(hours || "0"), parseInt(minutes || "0"));
  return date.toLocaleString("el-GR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (value: string | number) => {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  return numValue.toFixed(2);
};

const formatLocationName = (locationName: string) => {
  return locationName || "";
};

const getPaymentMethodName = (payment?: string) => {
  if (!payment) return "";
  return payment === "cod" ? "Μετρητά" : "Κάρτα";
};

const getOrderTypeDisplayName = (
  orderType?: string,
  orderTypeName?: string
) => {
  if (orderTypeName) {
    const typeName = orderTypeName.toLowerCase();
    if (
      typeName.includes("delivery") ||
      typeName.includes("διανομή") ||
      typeName.includes("παράδοση")
    ) {
      return "Delivery";
    }
    if (
      typeName.includes("collection") ||
      typeName.includes("pickup") ||
      typeName.includes("παραλαβή") ||
      typeName.includes("takeaway")
    ) {
      return "Takeaway";
    }
    return orderTypeName;
  }

  if (!orderType) return "N/A";
  const type = orderType.toLowerCase();
  if (type === "delivery" || type.includes("delivery")) {
    return "Delivery";
  }
  if (
    type === "collection" ||
    type.includes("collection") ||
    type.includes("pickup")
  ) {
    return "Takeaway";
  }
  return orderType;
};

const translateTotalTitle = (title: string, code: string) => {
  if (code === "subtotal") return "Υποσύνολο";
  if (code === "total") return "Σύνολο";
  if (title.toLowerCase().includes("subtotal")) return "Υποσύνολο";
  if (
    title.toLowerCase().includes("total") &&
    !title.toLowerCase().includes("subtotal")
  )
    return "Σύνολο";
  return title;
};

// Dynamic styles based on paper size
const getStyles = (paperSize: string) => {
  const isThermal = paperSize === "80mm" || paperSize === "58mm";
  const is80mm = paperSize === "80mm";
  const is58mm = paperSize === "58mm";
  const isA5 = paperSize === "A5";

  return StyleSheet.create({
    page: {
      padding: 0, // No page padding - content wrapper will handle spacing
      paddingHorizontal: 0,
      fontSize: is80mm ? 10 : is58mm ? 9 : isA5 ? 10 : 12,
      fontFamily: "Helvetica",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      // Content width will be adjusted via wrapper View, page is always A4
    },
    header: {
      marginBottom: is80mm ? 8 : is58mm ? 6 : 12,
      width: "100%",
    },
    title: {
      fontSize: is80mm ? 14 : is58mm ? 12 : isA5 ? 18 : 24,
      fontWeight: "bold",
      marginBottom: is80mm ? 4 : is58mm ? 3 : 8,
      textAlign: "center",
    },
    section: {
      marginBottom: is80mm ? 5 : is58mm ? 4 : 10,
      width: "100%",
    },
    row: {
      flexDirection: isThermal ? "column" : "row",
      marginBottom: is80mm ? 3 : is58mm ? 2 : 5,
      width: "100%",
    },
    col: {
      flex: 1,
      width: "100%",
    },
    label: {
      fontSize: is80mm ? 9 : is58mm ? 8 : isA5 ? 9 : 11,
      marginBottom: is80mm ? 2 : is58mm ? 1 : 4,
      fontWeight: "bold",
    },
    value: {
      fontSize: is80mm ? 10 : is58mm ? 9 : isA5 ? 10 : 12,
      marginBottom: is80mm ? 3 : is58mm ? 2 : 4,
    },
    table: {
      width: "100%",
      marginTop: is80mm ? 8 : is58mm ? 6 : 10,
      marginBottom: is80mm ? 8 : is58mm ? 6 : 10,
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: isThermal ? 0.5 : 1,
      borderBottomColor: "#000",
      paddingVertical: is80mm ? 3 : is58mm ? 2 : 5,
      width: "100%",
    },
    tableCell: {
      fontSize: is80mm ? 9 : is58mm ? 8 : isA5 ? 9 : 11,
      paddingHorizontal: is80mm ? 2 : is58mm ? 1 : 4,
    },
    tableCellQty: {
      width: is80mm ? "12%" : is58mm ? "10%" : "15%",
      textAlign: "center",
      flexShrink: 0,
    },
    tableCellName: {
      width: is80mm ? "53%" : is58mm ? "55%" : "60%",
      flexGrow: 1,
    },
    tableCellPrice: {
      width: is80mm ? "35%" : is58mm ? "35%" : "25%",
      textAlign: "right",
      flexShrink: 0,
    },
    itemName: {
      fontWeight: "bold",
      marginBottom: is80mm ? 2 : is58mm ? 1 : 4,
      fontSize: is80mm ? 10 : is58mm ? 9 : undefined,
    },
    optionText: {
      fontSize: is80mm ? 8 : is58mm ? 7 : isA5 ? 8 : 10,
      marginLeft: is80mm ? 3 : is58mm ? 2 : 8,
      marginTop: is80mm ? 1 : is58mm ? 0.5 : 2,
    },
    comment: {
      fontSize: is80mm ? 8 : is58mm ? 7 : isA5 ? 8 : 10,
      fontStyle: "italic",
      marginTop: is80mm ? 2 : is58mm ? 1 : 4,
    },
    footer: {
      marginTop: is80mm ? 10 : is58mm ? 8 : 12,
      textAlign: "center",
      fontSize: is80mm ? 9 : is58mm ? 8 : isA5 ? 10 : 12,
    },
    divider: {
      borderBottomWidth: 1,
      borderBottomColor: "#000",
      marginVertical: is80mm ? 5 : is58mm ? 4 : 8,
    },
    strong: {
      fontWeight: "bold",
    },
  });
};

export const InvoicePDF: React.FC<InvoicePDFProps> = ({ order, paperSize }) => {
  const styles = getStyles(paperSize);
  const isThermal = paperSize === "80mm" || paperSize === "58mm";
  const is80mm = paperSize === "80mm";
  const is58mm = paperSize === "58mm";
  const isA5 = paperSize === "A5";

  // Always use A4 page size - never adjust the paper size
  const pageSize: "A4" = "A4";
  
  // Calculate content width in points based on paperSize setting
  // This only affects the content width, not the PDF page size
  // A4 = 210mm = 595.28 points
  // A5 = 148mm = 419.53 points
  // 80mm = 226.77 points
  // 58mm = 164.41 points
  const contentWidth = is80mm 
    ? 80 * 2.83465 
    : is58mm 
    ? 58 * 2.83465 
    : isA5 
    ? 419.53 
    : 595.28; // Default to full A4 width

  return (
    <Document>
      <Page 
        size={pageSize} 
        style={styles.page}
      >
        {/* Always wrap content in a container with adjusted width - page is always A4 */}
        <View style={{
          width: contentWidth,
          maxWidth: contentWidth,
          alignSelf: "flex-start", // Align to left edge of A4 page
          padding: isThermal ? 0 : (isA5 ? 20 : 30), // No padding for thermal, add padding for A4/A5
          paddingHorizontal: isThermal ? 0 : (isA5 ? 20 : 30),
          margin: 0,
        }}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Παραγγελία #{order.order_id}</Text>
            </View>

            <View style={styles.divider} />

            {/* Order Items Table */}
            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.tableCellQty, styles.strong]}>
                  Ποσ.
                </Text>
                <Text style={[styles.tableCell, styles.tableCellName, styles.strong]}>
                  Προϊόν
                </Text>
                <Text
                  style={[styles.tableCell, styles.tableCellPrice, styles.strong]}
                >
                  Τιμή
                </Text>
              </View>

              {/* Table Rows */}
              {order.order_menus && order.order_menus.length > 0
                ? order.order_menus.map((menu) => {
                    return (
                      <View key={menu.order_menu_id} style={styles.tableRow}>
                        <Text style={[styles.tableCell, styles.tableCellQty]}>
                          {menu.quantity}x
                        </Text>
                        <View style={[styles.tableCell, styles.tableCellName]}>
                          <Text style={styles.itemName}>
                            {menu.name || "N/A"}
                          </Text>
                          {menu.menu_options && menu.menu_options.length > 0
                            ? menu.menu_options.map((option: any, idx: number) => {
                                const quantity =
                                  option.quantity > 1
                                    ? `${option.quantity} × `
                                    : "";
                                const price =
                                  option.order_option_price &&
                                  parseFloat(option.order_option_price) > 0
                                    ? ` (${parseFloat(
                                        option.order_option_price
                                      ).toFixed(2)}€)`
                                    : "";
                                const optionName =
                                  option.order_option_name || option.name || "";
                                return (
                                  <Text key={idx} style={styles.optionText}>
                                    • {quantity}
                                    {optionName}
                                    {price}
                                  </Text>
                                );
                              })
                            : null}
                          {menu.comment ? (
                            <Text style={styles.comment}>
                              <Text style={styles.strong}>{menu.comment}</Text>
                            </Text>
                          ) : null}
                        </View>
                        <Text style={[styles.tableCell, styles.tableCellPrice]}>
                          {formatCurrency(menu.subtotal)}{" "}
                          {order.currency === "EUR" ? "€" : order.currency}
                        </Text>
                      </View>
                    );
                  })
                : null}
            </View>

            <View style={styles.divider} />

            {/* Order Totals */}
            <View style={styles.table}>
              {order.order_totals
                ? order.order_totals
                    .sort((a, b) => a.priority - b.priority)
                    .filter((total) => {
                      // Skip delivery total for collection orders
                      return !(
                        order.order_type === "collection" &&
                        total.code === "delivery"
                      );
                    })
                    .map((total) => {
                      return (
                        <View key={total.order_total_id} style={styles.tableRow}>
                          <Text style={[styles.tableCell, styles.tableCellQty]}>
                            {" "}
                          </Text>
                          <Text style={[styles.tableCell, styles.tableCellName]}>
                            {translateTotalTitle(total.title, total.code)}
                          </Text>
                          <Text style={[styles.tableCell, styles.tableCellPrice]}>
                            {formatCurrency(total.value)}{" "}
                            {order.currency === "EUR" ? "€" : order.currency}
                          </Text>
                        </View>
                      );
                    })
                : null}
            </View>

            {/* Customer and Order Info - Two column layout for A4, single column for thermal/A5 */}
            <View style={styles.section}>
              {isThermal ? (
                <View>
                  <Text style={styles.label}>
                    <Text style={styles.strong}>Πελάτης</Text>
                  </Text>
                  <Text style={styles.value}>
                    {order.customer_name || "N/A"}
                  </Text>
                  {order.telephone ? (
                    <Text style={styles.value}>{order.telephone}</Text>
                  ) : null}
                  {order.email ? (
                    <Text style={styles.value}>{order.email}</Text>
                  ) : null}

                  {order.order_type === "delivery" ? (
                    <View style={{ marginTop: is80mm ? 4 : 3 }}>
                      <Text style={styles.label}>
                        <Text style={styles.strong}>Διεύθυνση Παράδοσης</Text>
                      </Text>
                      <Text style={styles.value}>
                        {formatLocationName(order.location_name) || "N/A"}
                      </Text>
                      {order.floor ? (
                        <Text style={styles.value}>Όροφος: {order.floor}</Text>
                      ) : null}
                      {order.bell_name ? (
                        <Text style={styles.value}>
                          Κουδούνι: {order.bell_name}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}

                  <View style={{ marginTop: is80mm ? 4 : 3 }}>
                    <Text style={styles.label}>
                      <Text style={styles.strong}>Πληρωμή</Text>
                    </Text>
                    <Text style={styles.value}>
                      {getPaymentMethodName(order.payment)}
                    </Text>
                  </View>

                  <View style={{ marginTop: is80mm ? 4 : 3 }}>
                    <Text style={styles.label}>
                      <Text style={styles.strong}>Τύπος παραγγελίας</Text>
                    </Text>
                    <Text style={styles.value}>
                      {getOrderTypeDisplayName(order.order_type, order.order_type_name)}
                    </Text>
                  </View>

                  <View style={{ marginTop: is80mm ? 4 : 3 }}>
                    <Text style={styles.label}>
                      <Text style={styles.strong}>Ημερομηνία Παραγγελίας</Text>
                    </Text>
                    <Text style={styles.value}>
                      {formatDateTime(order.order_date, order.order_time)}
                    </Text>
                  </View>

                  {order.comment ? (
                    <View style={{ marginTop: is80mm ? 4 : 3 }}>
                      <Text style={styles.label}>
                        <Text style={styles.strong}>Σχόλιο Παραγγελίας</Text>
                      </Text>
                      <Text style={styles.value}>{order.comment}</Text>
                    </View>
                  ) : null}
                </View>
              ) : (
                <View style={styles.row}>
                  <View style={styles.col}>
                    <Text style={styles.label}>
                      <Text style={styles.strong}>Πελάτης</Text>
                    </Text>
                    <Text style={styles.value}>
                      {order.customer_name || "N/A"}
                    </Text>
                    {order.telephone ? (
                      <Text style={styles.value}>{order.telephone}</Text>
                    ) : null}
                    {order.email ? (
                      <Text style={styles.value}>{order.email}</Text>
                    ) : null}

                    {order.order_type === "delivery" ? (
                      <View style={{ marginTop: 8 }}>
                        <Text style={styles.label}>
                          <Text style={styles.strong}>Διεύθυνση Παράδοσης</Text>
                        </Text>
                        <Text style={styles.value}>
                          {formatLocationName(order.location_name) || "N/A"}
                        </Text>
                        {order.floor ? (
                          <Text style={styles.value}>Όροφος: {order.floor}</Text>
                        ) : null}
                        {order.bell_name ? (
                          <Text style={styles.value}>
                            Κουδούνι: {order.bell_name}
                          </Text>
                        ) : null}
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.col}>
                    <Text style={[styles.label, { textAlign: "right" }]}>
                      <Text style={styles.strong}>Πληρωμή</Text>
                    </Text>
                    <Text style={[styles.value, { textAlign: "right" }]}>
                      {getPaymentMethodName(order.payment)}
                    </Text>

                    <Text
                      style={[
                        styles.label,
                        { textAlign: "right", marginTop: 8 },
                      ]}
                    >
                      <Text style={styles.strong}>Τύπος παραγγελίας</Text>
                    </Text>
                    <Text style={[styles.value, { textAlign: "right" }]}>
                      {getOrderTypeDisplayName(order.order_type, order.order_type_name)}
                    </Text>

                    <Text
                      style={[
                        styles.label,
                        { textAlign: "right", marginTop: 8 },
                      ]}
                    >
                      <Text style={styles.strong}>Ημερομηνία Παραγγελίας</Text>
                    </Text>
                    <Text style={[styles.value, { textAlign: "right" }]}>
                      {formatDateTime(order.order_date, order.order_time)}
                    </Text>

                    {order.comment ? (
                      <View style={{ marginTop: 8 }}>
                        <Text style={[styles.label, { textAlign: "right" }]}>
                          <Text style={styles.strong}>Σχόλιο Παραγγελίας</Text>
                        </Text>
                        <Text style={[styles.value, { textAlign: "right" }]}>
                          {order.comment}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              )}
            </View>

            {/* Thank You Message */}
            <View style={styles.footer}>
              <Text>Ευχαριστούμε για την παραγγελία σας!</Text>
            </View>
          </View>
      </Page>
    </Document>
  );
};
