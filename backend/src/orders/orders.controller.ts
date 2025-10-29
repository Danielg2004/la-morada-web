import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(@Inject('PG_POOL') private readonly pool: Pool) {}

  // Crea la orden desde el carrito (status requires_payment)
  @Post('checkout')
  async checkout(@Req() req: any) {
    const userId = req.user.userId;
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Cart + items
      const cart = await client.query(`SELECT id FROM carts WHERE user_id=$1 LIMIT 1`, [userId]);
      if (!cart.rows[0]) throw new Error('Carrito vacío');
      const cartId = cart.rows[0].id;

      const items = await client.query(
        `SELECT ci.ebook_id, ci.quantity, e.price
           FROM cart_items ci
           JOIN ebooks e ON e.id = ci.ebook_id
          WHERE ci.cart_id = $1`,
        [cartId],
      );
      if (items.rows.length === 0) throw new Error('Carrito vacío');

      const subtotal = items.rows.reduce((s, r) => s + Number(r.price) * r.quantity, 0);
      const total = subtotal; // aquí podrías sumar impuestos o descuentos

      const orderIns = await client.query(
        `INSERT INTO orders (user_id, status, subtotal, total)
         VALUES ($1,'requires_payment',$2,$3)
         RETURNING id, status, subtotal, total, created_at`,
        [userId, subtotal, total],
      );
      const orderId = orderIns.rows[0].id;

      for (const it of items.rows) {
        await client.query(
          `INSERT INTO order_items (order_id, ebook_id, price, quantity)
           VALUES ($1,$2,$3,$4)`,
          [orderId, it.ebook_id, it.price, it.quantity],
        );
      }

      // Clean cart
      await client.query(`DELETE FROM cart_items WHERE cart_id = $1`, [cartId]);

      // Crear intent de pago simulado
      const pi = await client.query(
        `INSERT INTO payment_intents (order_id, status)
         VALUES ($1, 'requires_confirmation')
         RETURNING id, status`,
        [orderId],
      );

      await client.query('COMMIT');
      return { order: orderIns.rows[0], payment_intent: pi.rows[0] };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}
