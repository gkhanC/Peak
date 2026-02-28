import {
  pgTable,
  serial,
  varchar,
  timestamp,
  jsonb,
  integer,
} from 'drizzle-orm/pg-core';

/**
 * 'boards' tablosu: Kullanıcının takip panolarını saklar.
 * Her pano, belirli bir konuyu (örn: Fitness, Yazılım) temsil eder.
 */
export const boards = pgTable('boards', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(), // Pano adı
  description: varchar('description', { length: 500 }), // Pano açıklaması
  theme: varchar('theme', { length: 50 }).default('default').notNull(), // Görsel tema (sport, work, vb.)
  tag: varchar('tag', { length: 100 }), // Kategori etiketi
  color: varchar('color', { length: 50 }), // (Opsiyonel) Özel renk kodu
  illustration: varchar('illustration', { length: 255 }), // Pano kartında gösterilecek görsel
  progressionMethod: varchar('progression_method', { enum: ['lastTwo', 'sinceCreation'] }).default('sinceCreation').notNull(), // İlerleme hesaplama yöntemi
  createdAt: timestamp('created_at').defaultNow().notNull(), // Oluşturulma tarihi
});

/**
 * 'metric_definitions' tablosu: Panolara bağlı metriklerin tanımlarını saklar.
 * Metrikler, neyin takip edildiğini ve verinin yapısını belirler.
 */
export const metricDefinitions = pgTable('metric_definitions', {
  id: serial('id').primaryKey(),
  boardId: integer('board_id')
    .references(() => boards.id)
    .notNull(), // Bağlı olduğu pano
  name: varchar('name', { length: 255 }).notNull(), // Metrik adı (örn: Koşu Mesafesi)
  type: varchar('type', { enum: ['SingleValue', 'CompoundValue', 'Task', 'Count', 'Goal', 'CountTime', 'MeasurementTime'] }).notNull(), // Metrik tipi
  schema: jsonb('schema').notNull(), // Veri yapısı şeması (JSON)
  target: integer('target'), // (Opsiyonel) Hedeflenen değer
  progressDirection: varchar('progress_direction', { enum: ['Ascending', 'Descending'] }).notNull(), // Gelişim yönü (Artan/Azalan)
  progressionMethod: varchar('progression_method', { enum: ['lastTwo', 'sinceCreation'] }).default('sinceCreation').notNull(), // Metriğe özel ilerleme yöntemi
});

/**
 * 'entries' tablosu: Metrikler için girilen zaman damgalı verileri saklar.
 */
export const entries = pgTable('entries', {
  id: serial('id').primaryKey(),
  metricId: integer('metric_id')
    .references(() => metricDefinitions.id)
    .notNull(), // İlgili metrik tanımı
  timestamp: timestamp('timestamp').defaultNow().notNull(), // Kayıt zamanı
  data: jsonb('data').notNull(), // Girilen veri (JSON)
});
