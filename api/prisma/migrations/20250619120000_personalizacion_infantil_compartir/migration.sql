-- Opciones de personalización para Menú infantil y Para compartir (idempotente).

INSERT INTO personalizacion_opcion (id_producto, tipo, descripcion)
SELECT p.id_producto, v.tipo::"TipoPersonalizacion", v.descripcion
FROM producto p
INNER JOIN categoria c ON c.id_categoria = p.id_categoria
CROSS JOIN (
  VALUES
    ('omitir_ingrediente', 'Sin yuca'),
    ('omitir_ingrediente', 'Sin papa'),
    ('omitir_ingrediente', 'Sin ensalada'),
    ('omitir_ingrediente', 'Sin mazorca'),
    ('aderezo', 'Chipotle'),
    ('aderezo', 'Agridulce'),
    ('aderezo', 'Chimichurri')
) AS v(tipo, descripcion)
WHERE (
  c.nombre LIKE 'Platos fuertes%'
  OR c.nombre = 'Menú infantil'
  OR c.nombre = 'Para compartir'
)
AND p.es_acompanamiento_mazorca = false
AND NOT EXISTS (
  SELECT 1
  FROM personalizacion_opcion po
  WHERE po.id_producto = p.id_producto
    AND po.tipo = v.tipo::"TipoPersonalizacion"
    AND po.descripcion = v.descripcion
);
