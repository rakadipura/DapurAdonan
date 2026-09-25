# Custom Cake Delivery Fee Override

Custom cake orders (`isCustomCake=true`) use a car delivery fee tier regardless of the selected delivery zone. Regular orders use the zone's motorcycle fee.

This is a fee calculation override at order creation time, not a separate zone. The override exists because custom cakes require car transport (size/fragility) while regular items use motorcycle delivery.