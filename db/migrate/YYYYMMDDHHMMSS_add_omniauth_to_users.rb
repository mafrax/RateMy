# db/migrate/YYYYMMDDHHMMSS_add_omniauth_to_users.rb
class AddOmniauthToUsers < ActiveRecord::Migration[6.1]
  def change
    add_column :users, :provider, :string
    add_column :users, :uid, :string
    add_column :users, :image, :string
    add_index :users, [:provider, :uid], unique: true
  end
end
