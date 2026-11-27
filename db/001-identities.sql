CREATE TABLE IF NOT EXISTS identities (
  id1     VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_bin NOT NULL,
  id2     VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_bin NOT NULL,
  user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  PRIMARY KEY (id1, id2),
  UNIQUE KEY uq_identities_user_id (user_id)
) ENGINE=InnoDB;
