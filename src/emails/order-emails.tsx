import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { formatPence } from "@/lib/money";

export interface EmailOrder {
  orderNumber: string;
  channel: "WEBSITE" | "WHATSAPP";
  customerName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  subtotal: number;
  deliveryFee: number;
  deliveryMethod: string | null;
  total: number;
  notes: string | null;
  items: {
    productName: string;
    sku: string;
    size: string;
    colour: string;
    quantity: number;
    lineTotal: number;
  }[];
}

const colours = {
  green: "#1F4D3F",
  ivory: "#FBF8F2",
  ink: "#16332A",
  body: "#4A5651",
  sand: "#F2EADB",
};

const styles = {
  body: {
    backgroundColor: colours.ivory,
    fontFamily: "Helvetica, Arial, sans-serif",
    color: colours.body,
  },
  container: {
    backgroundColor: "#ffffff",
    margin: "24px auto",
    padding: "32px",
    maxWidth: "560px",
    borderRadius: "16px",
  },
  brand: {
    fontFamily: "Georgia, serif",
    fontSize: "24px",
    letterSpacing: "4px",
    color: colours.ink,
    margin: 0,
  },
  h1: { fontFamily: "Georgia, serif", fontSize: "26px", color: colours.ink, margin: "24px 0 8px" },
  small: { fontSize: "13px", color: colours.body, margin: "2px 0" },
  row: { fontSize: "14px", margin: "4px 0", color: colours.ink },
};

function Items({ order }: { order: EmailOrder }) {
  return (
    <Section>
      {order.items.map((item, i) => (
        <Section key={i} style={{ padding: "10px 0", borderBottom: `1px solid ${colours.sand}` }}>
          <Text style={styles.row}>
            <strong>{item.productName}</strong> × {item.quantity} — {formatPence(item.lineTotal)}
          </Text>
          <Text style={styles.small}>
            Size {item.size} · {item.colour} · SKU {item.sku}
          </Text>
        </Section>
      ))}
      <Text style={styles.row}>Subtotal: {formatPence(order.subtotal)}</Text>
      <Text style={styles.row}>
        Delivery{order.deliveryMethod ? ` (${order.deliveryMethod})` : ""}:{" "}
        {order.deliveryFee === 0 ? "Free" : formatPence(order.deliveryFee)}
      </Text>
      <Text style={{ ...styles.row, fontSize: "16px" }}>
        <strong>Total: {formatPence(order.total)}</strong>
      </Text>
    </Section>
  );
}

export function OrderConfirmationEmail({
  order,
  siteUrl,
  storeName,
  returnsDays,
}: {
  order: EmailOrder;
  siteUrl: string;
  storeName: string;
  returnsDays: number;
}) {
  return (
    <Html lang="en-GB">
      <Head />
      <Preview>{`Thank you for your order ${order.orderNumber}`}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Text style={styles.brand}>YM TEXTILES</Text>
          <Heading style={styles.h1}>Thank you for your order</Heading>
          <Text style={styles.row}>
            Hi {order.customerName?.split(" ")[0] ?? "there"}, we&apos;ve received your payment for
            order <strong>{order.orderNumber}</strong> and will let you know when it ships.
          </Text>
          <Hr />
          <Items order={order} />
          {order.address ? (
            <>
              <Hr />
              <Text style={styles.small}>Delivering to: {order.address}</Text>
            </>
          ) : null}
          <Hr />
          <Text style={styles.small}>
            You can cancel and return your order within {returnsDays} days of delivery. See{" "}
            <Link href={`${siteUrl}/pages/delivery-returns`}>delivery and returns</Link>.
          </Text>
          <Text style={styles.small}>
            Questions? Reply to this email or{" "}
            <Link href={`${siteUrl}/pages/contact`}>contact us</Link>.
          </Text>
          <Text style={{ ...styles.small, marginTop: "16px" }}>{storeName}</Text>
        </Container>
      </Body>
    </Html>
  );
}

export function AdminNewOrderEmail({ order, adminUrl }: { order: EmailOrder; adminUrl: string }) {
  const via =
    order.channel === "WHATSAPP" ? "WhatsApp (awaiting your confirmation)" : "website (paid)";
  return (
    <Html lang="en-GB">
      <Head />
      <Preview>{`New order ${order.orderNumber}: ${formatPence(order.total)}`}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Text style={styles.brand}>YM TEXTILES</Text>
          <Heading style={styles.h1}>New order {order.orderNumber}</Heading>
          <Text style={styles.row}>Received via {via}.</Text>
          <Text style={styles.small}>Customer: {order.customerName ?? "not given"}</Text>
          {order.email ? <Text style={styles.small}>Email: {order.email}</Text> : null}
          {order.phone ? <Text style={styles.small}>Phone: +{order.phone}</Text> : null}
          {order.address ? <Text style={styles.small}>Address: {order.address}</Text> : null}
          {order.notes ? <Text style={styles.small}>Note: {order.notes}</Text> : null}
          <Hr />
          <Items order={order} />
          <Hr />
          <Link href={adminUrl} style={{ color: colours.green, fontWeight: 600 }}>
            Open the order in admin
          </Link>
        </Container>
      </Body>
    </Html>
  );
}
