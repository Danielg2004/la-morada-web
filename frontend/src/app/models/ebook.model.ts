export interface Ebook {
  id: string;
  titulo: string;
  imagen_url?: string;
  archivo_url?: string;
  descripcion?: string;
  creado_por?: string;
  creado_en?: string;
  autor_nombre?: string;
  es_favorito?: boolean;
}
