export interface Ebook {
  id: string;
  titulo: string;
  imagen_url?: string | null;
  archivo_url?: string | null;
  descripcion?: string | null;
  price: number;             // <- nuevo
  es_favorito?: boolean;
  creado_en: string;
  autor_nombre?: string;
  autor_apellidos?: string;
}
