exports.up = function(knex) {
  return knex.schema.createTable('ranks', function(table) {
    table.increments('id').primary();
    table.string('name').notNullable().unique();
    table.integer('min_referrals').notNullable();
    table.decimal('commission_rate', 5, 2).notNullable();
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('ranks');
};
