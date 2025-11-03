exports.up = function(knex) {
  return knex.schema.createTable('transactions', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('type').notNullable(); // e.g., deposit, withdrawal, commission
    table.decimal('amount', 18, 8).notNullable();
    table.string('status').notNullable().defaultsTo('pending'); // e.g., pending, completed, failed
    table.string('tx_hash').unique();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('transactions');
};
