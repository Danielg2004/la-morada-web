import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(@Inject('PG_POOL') private readonly pool: Pool) {}

  // "Confirmar" el pago y marcar la orden como pagada
  @Post('confirm')
  async confirm(@Req() req: any, @Body() body: { payment_intent_id: string }) {
    const userId = req.user.userId;
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const pi = await client.query(
        `SELECT id, order_id, status
           FROM payment_intents
          WHERE id = $1
          LIMIT 1`,
        [body.payment_intent_id],
      );
      if (!pi.rows[0]) throw new Error('Payment intent no encontrado');
      const orderId = pi.rows[0].order_id;

      // Validar orden y dueño
      const order = await client.query(
        `SELECT id, user_id, status FROM orders WHERE id = $1`,
        [orderId],
      );
      if (!order.rows[0] || order.rows[0].user_id !== userId) {
        throw new Error('Orden no válida');
      }
      if (order.rows[0].status !== 'requires_payment') {
        // Podrías permitir reintentos según tu lógica
      }

      // Marcar intent y orden como pagados
      await client.query(
        `UPDATE payment_intents SET status = 'succeeded' WHERE id = $1`,
        [body.payment_intent_id],
      );
      await client.query(
        `UPDATE orders SET status = 'succeeded', paid_at = now() WHERE id = $1`,
        [orderId],
      );

      // Conceder acceso
      const items = await client.query(
        `SELECT ebook_id, quantity FROM order_items WHERE order_id = $1`,
        [orderId],
      );
      for (const it of items.rows) {
        await client.query(
          `INSERT INTO ebook_purchases (user_id, ebook_id)
           VALUES ($1,$2)
           ON CONFLICT (user_id, ebook_id) DO NOTHING`,
          [userId, it.ebook_id],
        );
      }

      await client.query('COMMIT');
      return { ok: true, order_id: orderId };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}
