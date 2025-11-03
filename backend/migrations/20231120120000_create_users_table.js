exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.increments('id').primary();
    table.string('wallet_address').notNullable().unique();
    table.string('username').notNullable().unique();
    table.string('email').unique();
    table.string('password_hash');
    table.string('referral_code').notNullable().unique();
    table.integer('referrer_id').unsigned().references('id').inTable('users');
    table.integer('rank_id').unsigned().references('id').inTable('ranks').defaultsTo(1);
    table.decimal('balance', 18, 8).defaultsTo(0.00000000);
    table.boolean('is_active').defaultsTo(true);
    table.boolean('is_admin').defaultsTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('last_login');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};
