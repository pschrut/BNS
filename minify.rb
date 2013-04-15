require 'rubygems'
require 'Sprockets'
require 'hpricot'

# Minifies an array of JS files into a single file

def minify_js(files, dest_file)

  puts "Minifying files into #{dest_file}"

  secretary = Sprockets::Secretary.new(
    :source_files => files
  )

  # Generate a Sprockets::Concatenation object from the source files
  concatenation = secretary.concatenation
  # Write the concatenation to disk
  concatenation.save_to(dest_file)

  # Minify files using YUI compressor
  minification = `java -jar yuicompressor-2.4.2.jar --nomunge --charset utf-8 #{dest_file}`
  min_js = File.new(dest_file, "w")
  min_js.write(minification)
  min_js.close
end

# Minifies a CSS file

def minify_css(file, dest_file)
  puts "Minifying #{file} into #{dest_file}"

  minification = `java -jar yuicompressor-2.4.2.jar --type css --charset utf-8 #{file}`
  css = File.new(dest_file, "w")
  css.write(minification)
  css.close
end

def backup_files()
  ["index.html", "css/CSS2.css", "css/CSS2_IE6.css", "css/CSS2_IE7.css"].each do |filename|
    File.rename(filename, filename + ".bak")
  end
end

# Minifies the whole application
def minify()
  # Parse the index.html
  doc = Hpricot(open("index.html"))

  puts "Minifying framework files"
  # Select the framework files into an array
  fwk_files = doc.search('head script[@src]').map { |x| x['src'] }
  #remove the scripts
  (doc/"head/script").remove
  # Minify them
  minify_js(fwk_files, "fwk_min.js")

  puts "Minifying application & modules files"
  # Select the applications & modules files into an array
  app_files = doc.search('body script[@src]').map { |x| x['src']}
  #remove the scripts
  (doc/"body/script").remove
  # Minify them
  minify_js(app_files, "apps_min.js")

  #write the new scripts into the document
  (doc/"head").append("<script type='text/javascript' src='fwk_min.js'></script>");
  (doc/"body").append("<script type='text/javascript' src='apps_min.js'></script>");

  backup_files

  puts "Minifying CSS files"
  
  ["css/CSS2.css", "css/CSS2_IE6.css", "css/CSS2_IE7.css"].each do |filename|
    minify_css(filename + ".bak", filename)
  end

  puts "Writing minified index.html"
  #write the new document
  html = File.new("index.html", "w")
  html.write(doc.to_s.tr("\t\n",""))
  html.close
end

minify

puts "Done, press enter to exit."
gets
