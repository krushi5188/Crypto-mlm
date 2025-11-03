exports.up = function(knex) {
  return knex.schema.createTable('login_history', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.string('ip_address');
    table.string('user_agent');
    table.string('device_type');
    table.string('location');
    table.timestamp('login_timestamp').defaultTo(knex.fn.now());
    table.boolean('is_suspicious').defaultsTo(false);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('login_history');
};
