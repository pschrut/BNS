require 'rubygems'
require 'Sprockets'
require 'hpricot'

def restore_files()
  ["index.html", "css/CSS2.css", "css/CSS2_IE6.css", "css/CSS2_IE7.css"].each do |filename|
    File.rename(filename + ".bak", filename)
  end
end

restore_files

puts "Files restored, pres enter to exit"
gets
