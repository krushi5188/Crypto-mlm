exports.up = function(knex) {
  return knex.schema.createTable('achievements', function(table) {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('description');
    table.string('icon');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('achievements');
};
