-- Add bookingId column to Order table
ALTER TABLE "Order" ADD COLUMN "bookingId" INTEGER;

-- Add foreign key constraint
ALTER TABLE "Order" ADD CONSTRAINT "Order_bookingId_fkey" 
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create index for better query performance
CREATE INDEX "Order_bookingId_idx" ON "Order"("bookingId");