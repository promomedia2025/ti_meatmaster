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
  const isA5 = paperSize === "A5";

  return StyleSheet.create({
    page: {
      padding: isThermal ? 8 : isA5 ? 20 : 30,
      fontSize: isThermal ? 8 : isA5 ? 10 : 12,
      fontFamily: "Helvetica",
    },
    header: {
      marginBottom: isThermal ? 8 : 12,
    },
    title: {
      fontSize: isThermal ? 14 : isA5 ? 18 : 24,
      fontWeight: "bold",
      marginBottom: isThermal ? 4 : 8,
    },
    section: {
      marginBottom: isThermal ? 6 : 10,
    },
    row: {
      flexDirection: "row",
      marginBottom: isThermal ? 3 : 5,
    },
    col: {
      flex: 1,
    },
    label: {
      fontSize: isThermal ? 7 : isA5 ? 9 : 11,
      marginBottom: isThermal ? 2 : 4,
    },
    value: {
      fontSize: isThermal ? 8 : isA5 ? 10 : 12,
      fontWeight: "bold",
    },
    table: {
      width: "100%",
      marginTop: isThermal ? 6 : 10,
      marginBottom: isThermal ? 6 : 10,
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: "#000",
      paddingVertical: isThermal ? 3 : 5,
    },
    tableCell: {
      fontSize: isThermal ? 7 : isA5 ? 9 : 11,
      paddingHorizontal: isThermal ? 2 : 4,
    },
    tableCellQty: {
      width: "15%",
      textAlign: "center",
    },
    tableCellName: {
      width: "60%",
    },
    tableCellPrice: {
      width: "25%",
      textAlign: "right",
    },
    itemName: {
      fontWeight: "bold",
      marginBottom: isThermal ? 2 : 4,
    },
    optionText: {
      fontSize: isThermal ? 6 : isA5 ? 8 : 10,
      marginLeft: isThermal ? 4 : 8,
      marginTop: isThermal ? 1 : 2,
    },
    comment: {
      fontSize: isThermal ? 6 : isA5 ? 8 : 10,
      fontStyle: "italic",
      marginTop: isThermal ? 2 : 4,
    },
    footer: {
      marginTop: isThermal ? 8 : 12,
      textAlign: "center",
      fontSize: isThermal ? 8 : isA5 ? 10 : 12,
    },
    divider: {
      borderBottomWidth: 1,
      borderBottomColor: "#000",
      marginVertical: isThermal ? 4 : 8,
    },
    strong: {
      fontWeight: "bold",
    },
  });
};

export const InvoicePDF: React.FC<InvoicePDFProps> = ({ order, paperSize }) => {
  const styles = getStyles(paperSize);
  const isThermal = paperSize === "80mm" || paperSize === "58mm";
  const isA5 = paperSize === "A5";

  // Determine page size
  let pageSize: "A4" | "A5" | [number, number] = "A4";
  if (isA5) {
    pageSize = "A5";
  } else if (isThermal) {
    // Thermal printer: 80mm = 226.77 points, 58mm = 164.41 points
    const width = paperSize === "80mm" ? 226.77 : 164.41;
    pageSize = [width, 0]; // 0 height means continuous feed
  }

  return (
    <Document>
      <Page size={pageSize} style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Παραγγελία #{order.order_id}</Text>
        </View>

        <View style={styles.divider} />

        {/* Customer and Order Info */}
        <View style={styles.section}>
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
                <View style={{ marginTop: isThermal ? 4 : 8 }}>
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
                  { textAlign: "right", marginTop: isThermal ? 4 : 8 },
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
                  { textAlign: "right", marginTop: isThermal ? 4 : 8 },
                ]}
              >
                <Text style={styles.strong}>Ημερομηνία Παραγγελίας</Text>
              </Text>
              <Text style={[styles.value, { textAlign: "right" }]}>
                {formatDateTime(order.order_date, order.order_time)}
              </Text>

              {order.comment ? (
                <View style={{ marginTop: isThermal ? 4 : 8 }}>
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

        {/* Thank You Message */}
        <View style={styles.footer}>
          <Text>Ευχαριστούμε για την παραγγελία σας!</Text>
        </View>
      </Page>
    </Document>
  );
};
