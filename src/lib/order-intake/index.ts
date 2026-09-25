import { OrderIntake } from "./order-intake";
import { createProductionAdapter } from "./production-adapter";
import { createTestAdapter } from "./test-adapter";
import type {
  OrderIntakeAdapter,
  CreateOrderInput,
  OrderWithItems,
  OrderIntakeErrorCode,
  SettingsProvider,
  PickupWindow,
  DeliveryZone,
  ContactValidator,
  ProductData,
} from "./types";

export { OrderIntake, createProductionAdapter, createTestAdapter };
export type {
  OrderIntakeAdapter,
  CreateOrderInput,
  OrderWithItems,
  OrderIntakeErrorCode,
  SettingsProvider,
  PickupWindow,
  DeliveryZone,
  ContactValidator,
  ProductData,
} from "./types";
export { OrderIntakeError } from "./types";

export const orderIntake = new OrderIntake(createProductionAdapter());