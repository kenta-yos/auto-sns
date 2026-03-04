import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  jsonb,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";

export const postStatusEnum = pgEnum("post_status", [
  "draft",
  "scheduled",
  "publishing",
  "published",
  "failed",
]);

export const platformEnum = pgEnum("platform", ["x", "bluesky"]);

// ── users ──
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── platform_credentials ──
// encrypted は AES-256-GCM で暗号化した JSON を保存
export const platformCredentials = pgTable("platform_credentials", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  platform: platformEnum("platform").notNull(),
  encrypted: jsonb("encrypted").notNull(), // { iv, authTag, ciphertext }
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── post images (stored temporarily for scheduled posts) ──
export type PostImage = {
  data: string; // base64
  mimeType: string;
  alt: string;
};

// ── posts ──
export const posts = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  body: text("body").notNull(),
  platforms: jsonb("platforms").notNull().$type<string[]>(), // ["x", "bluesky"]
  images: jsonb("images").$type<PostImage[]>(),
  status: postStatusEnum("status").default("draft").notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── post_platform_results ──
export const postPlatformResults = pgTable("post_platform_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  postId: uuid("post_id")
    .references(() => posts.id, { onDelete: "cascade" })
    .notNull(),
  platform: platformEnum("platform").notNull(),
  success: integer("success").notNull().default(0), // 0=false, 1=true
  platformPostId: text("platform_post_id"),
  platformUrl: text("platform_url"),
  error: text("error"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
});

// ── bluesky_post_metrics ──
export const blueskyPostMetrics = pgTable("bluesky_post_metrics", {
  id: uuid("id").defaultRandom().primaryKey(),
  postId: uuid("post_id")
    .references(() => posts.id, { onDelete: "cascade" })
    .notNull(),
  platformPostUri: text("platform_post_uri").notNull(),
  likeCount: integer("like_count").notNull().default(0),
  repostCount: integer("repost_count").notNull().default(0),
  replyCount: integer("reply_count").notNull().default(0),
  collectedAt: timestamp("collected_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── bluesky_profile_metrics ──
export const blueskyProfileMetrics = pgTable("bluesky_profile_metrics", {
  id: uuid("id").defaultRandom().primaryKey(),
  followersCount: integer("followers_count").notNull().default(0),
  followsCount: integer("follows_count").notNull().default(0),
  postsCount: integer("posts_count").notNull().default(0),
  collectedAt: timestamp("collected_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
