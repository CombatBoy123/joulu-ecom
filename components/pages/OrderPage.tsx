import { OrderStatus } from "@/components/OrderStatus";
import { getMessages, type Locale } from "@/lib/i18n";
import { routes } from "@/lib/routes";

export function OrderPage({ locale }: { locale: Locale }) {
  return (
    <OrderStatus
      locale={locale}
      m={getMessages(locale).order}
      links={{ home: routes.home(locale), cart: routes.cart(locale) }}
    />
  );
}
