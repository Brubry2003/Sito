// JS per elenco3.html: ricerca, toggle e UI

document.addEventListener('DOMContentLoaded', function() {
  const gridContainer = document.getElementById('gridContainer');
  const searchInput = document.getElementById('searchInput');
  const didYouMean = document.getElementById('didYouMean');
  const noResults = document.getElementById('noResults');
  const classi = Array.from(document.querySelectorAll('.classe'));

  // Toggle apertura/chiusura al click sull'intestazione
  classi.forEach(classe => {
    classe.querySelector('h5').addEventListener('click', () => {
      classe.classList.toggle('collapsed');
    });
  });

  // Costruzione indice per Fuse.js
  const searchData = [];
  classi.forEach(classe => {
    // Dipartimento
    const deptName = classe.dataset.classe;
    searchData.push({
      text: deptName,
      element: classe,
      type: 'department'
    });
    // Corsi
    const courseLinks = classe.querySelectorAll('ul li a');
    courseLinks.forEach(link => {
      searchData.push({
        text: link.textContent,
        element: classe,
        type: 'course'
      });
    });
  });

  // Inizializza Fuse.js
  const fuse = new Fuse(searchData, {
    keys: ['text'],
    includeScore: true,
    threshold: 0.4,
    minMatchCharLength: 2,
    ignoreLocation: true,
    includeMatches: true
  });

  // Chiudi tutte le classi
  function chiudiTutte() {
    classi.forEach(c => {
      c.classList.add('collapsed');
      c.style.display = '';
    });
  }

  // Ricerca con correzione errori
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    didYouMean.innerHTML = '';
    noResults.style.display = 'none';

    if (q === '') {
      chiudiTutte();
      classi.forEach(classe => {
        classe.style.display = '';
        // Rimuovi evidenziazione
        const highlights = classe.querySelectorAll('.highlight');
        highlights.forEach(hl => {
          const parent = hl.parentNode;
          parent.replaceChild(document.createTextNode(hl.textContent), hl);
          parent.normalize();
        });
      });
      return;
    }

    const results = fuse.search(q);
    const departmentsToShow = new Set();
    let bestMatch = null;

    // Suggerimento se nessun risultato
    if (results.length === 0) {
      const suggestionSearch = fuse.search(q, { threshold: 0.6, limit: 1 });
      if (suggestionSearch.length > 0) {
        bestMatch = suggestionSearch[0].item.text;
        didYouMean.innerHTML = `Forse cercavi: <a id="suggestedTerm">${bestMatch}</a>`;
        document.getElementById('suggestedTerm').addEventListener('click', () => {
          searchInput.value = bestMatch;
          searchInput.dispatchEvent(new Event('input'));
        });
      }
      classi.forEach(classe => classe.style.display = 'none');
      noResults.style.display = 'block';
      return;
    }

    // Processa risultati
    results.forEach(result => {
      const item = result.item;
      departmentsToShow.add(item.element);
      // Evidenzia corrispondenze
      if (result.matches && result.matches.length > 0) {
        const match = result.matches[0];
        let text = item.text;
        let highlighted = '';
        let lastIndex = 0;
        match.indices.forEach(([start, end]) => {
          highlighted += text.substring(lastIndex, start);
          highlighted += `<span class="highlight">${text.substring(start, end + 1)}</span>`;
          lastIndex = end + 1;
        });
        highlighted += text.substring(lastIndex);
        if (item.type === 'department') {
          const h5 = item.element.querySelector('h5');
          h5.innerHTML = highlighted;
        } else {
          const links = item.element.querySelectorAll('ul li a');
          links.forEach(link => {
            if (link.textContent === item.text) {
              link.innerHTML = `<i class=\"fab fa-whatsapp me-1\"></i> ${highlighted}`;
            }
          });
        }
      }
    });

    // Nascondi tutti
    classi.forEach(classe => {
      classe.style.display = 'none';
    });
    // Mostra solo quelli con corrispondenze
    departmentsToShow.forEach(element => {
      element.style.display = '';
      element.classList.remove('collapsed');
    });
  });

  // All'avvio chiudi tutte le classi
  chiudiTutte();
});
