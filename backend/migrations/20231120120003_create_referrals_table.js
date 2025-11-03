exports.up = function(knex) {
  return knex.schema.createTable('referrals', function(table) {
    table.increments('id').primary();
    table.integer('referrer_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('referred_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('level').notNullable();
    table.decimal('commission_earned', 18, 8).defaultsTo(0.00000000);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('referrals');
};
