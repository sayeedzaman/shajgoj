-- New step between Placed (PENDING) and Processing: the store confirms the order
ALTER TYPE "OrderStatus" ADD VALUE 'CONFIRMED' AFTER 'PENDING';
