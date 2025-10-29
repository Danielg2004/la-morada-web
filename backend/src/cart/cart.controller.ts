import { Controller, Get, Post, Delete, Body, Req, UseGuards } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(@Inject('PG_POOL') private readonly pool: Pool) {}

  private async ensureCart(userId: string) {
    const get = await this.pool.query(
      `SELECT id FROM carts WHERE user_id = $1 LIMIT 1`, [userId],
    );
    if (get.rows[0]) return get.rows[0].id;
    const ins = await this.pool.query(
      `INSERT INTO carts (user_id) VALUES ($1) RETURNING id`, [userId],
    );
    return ins.rows[0].id;
  }

  @Get()
  async getCart(@Req() req: any) {
    const cartId = await this.ensureCart(req.user.userId);
    const items = await this.pool.query(
      `SELECT ci.id, ci.ebook_id, ci.quantity, e.titulo, e.price, e.imagen_url
         FROM cart_items ci
         JOIN ebooks e ON e.id = ci.ebook_id
        WHERE ci.cart_id = $1
        ORDER BY e.titulo`,
      [cartId],
    );
    const subtotal = items.rows.reduce((s, r) => s + Number(r.price) * r.quantity, 0);
    return { id: cartId, items: items.rows, subtotal };
  }

  @Post('items')
  async addItem(@Req() req: any, @Body() body: { ebookId: string; quantity?: number }) {
    const cartId = await this.ensureCart(req.user.userId);
    const q = body.quantity && body.quantity > 0 ? body.quantity : 1;

    // upsert sencillo
    await this.pool.query(
      `INSERT INTO cart_items (cart_id, ebook_id, quantity)
       VALUES ($1,$2,$3)
       ON CONFLICT (cart_id, ebook_id) DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity`,
      [cartId, body.ebookId, q],
    );
    return this.getCart(req);
  }

  @Post('items/update')
  async updateItem(@Req() req: any, @Body() body: { ebookId: string; quantity: number }) {
    const cartId = await this.ensureCart(req.user.userId);
    if (body.quantity <= 0) {
      await this.pool.query(
        `DELETE FROM cart_items WHERE cart_id = $1 AND ebook_id = $2`,
        [cartId, body.ebookId],
      );
    } else {
      await this.pool.query(
        `UPDATE cart_items SET quantity = $3 WHERE cart_id = $1 AND ebook_id = $2`,
        [cartId, body.ebookId, body.quantity],
      );
    }
    return this.getCart(req);
  }

  @Delete('items')
  async clear(@Req() req: any) {
    const cartId = await this.ensureCart(req.user.userId);
    await this.pool.query(`DELETE FROM cart_items WHERE cart_id = $1`, [cartId]);
    return { ok: true };
  }
}
