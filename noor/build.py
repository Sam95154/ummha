import re,os,zipfile
src=open('index.html',encoding='utf-8').read()
d=open('src/data.js',encoding='utf-8').read()
# validate surah metadata
raw=re.search(r'const raw="(.*?)";',d).group(1).split('|')
counts=[int(x.split(':')[1]) for x in raw]
assert len(counts)==114 and sum(counts)==6236,(len(counts),sum(counts))
print('metadata OK: 114 surahs, 6236 ayahs')
css=open('styles.css',encoding='utf-8').read();js=d+'\n'+open('src/app.js',encoding='utf-8').read()+'\n'+open('src/dataset-tools.js',encoding='utf-8').read()
out=src.replace('<link rel="stylesheet" href="styles.css">','<style>'+css+'</style>')
out=out.replace('<script src="src/data.js"></script><script src="src/app.js"></script>','<script>'+js+'</script>')
os.makedirs('dist',exist_ok=True);open('dist/noor-ul-islam-prototype.html','w',encoding='utf-8').write(out)
print('bundle KB',len(out.encode())//1024)