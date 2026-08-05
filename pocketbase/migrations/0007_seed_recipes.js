migrate(
  (app) => {
    // Seed de 10 receitas realistas para o público fitness brasileiro,
    // cobrindo todas as 5 categorias (2 por categoria). Idempotente:
    // verifica pelo nome antes de inserir. Receitas já existentes
    // (criadas em migrations anteriores) permanecem intocadas.
    const recipesCol = app.findCollectionByNameOrId('recipes')

    const recipeList = [
      // ---- Café da Manhã ----
      {
        name: 'Panqueca de Aveia e Banana',
        description:
          'Panqueca proteica sem glúten, doce e saciante, ideal para o pré-treino ou café da manhã.',
        category: 'cafe_da_manha',
        ingredients:
          'Aveia em flocos finos: 40g\nBanana madura amassada: 1 unidade\nOvo inteiro: 1 unidade\nClara de ovo: 1 unidade\nCanela em pó: a gosto\nEssência de baunilha: a gosto',
        instructions:
          '1. Amasse a banana e misture com a aveia, o ovo e a clara até formar uma massa.\n2. Adicione a canela e a baunilha.\n3. Aqueça uma frigideira antiaderente e despeje porções da massa.\n4. Doure de ambos os lados e sirva quente.',
        calories: 280,
        protein: 14,
        carbs: 42,
        fat: 6,
        prep_time: 15,
        servings: 1,
      },
      {
        name: 'Vitamina de Banana com Whey',
        description:
          'Vitamina anabólica de rápida absorção, perfeita para o café da manhã ou pós-treino.',
        category: 'cafe_da_manha',
        ingredients:
          'Leite desnatado: 250ml\nBanana prata: 1 unidade\nWhey protein de baunilha: 30g\nAveia em flocos: 20g\nCanela em pó: a gosto',
        instructions:
          '1. Bata todos os ingredientes no liquidificador por 40 segundos.\n2. Ajuste a espessura com mais ou menos leite.\n3. Sirva imediatamente gelado.',
        calories: 340,
        protein: 32,
        carbs: 44,
        fat: 5,
        prep_time: 5,
        servings: 1,
      },
      // ---- Almoço ----
      {
        name: 'Frango Grelhado com Batata Doce',
        description:
          'Combinação clássica de carboidrato de baixo índice glicêmico e proteína magra para o almoço.',
        category: 'almoco',
        ingredients:
          'Peito de frango: 160g\nBatata doce cozida: 150g\nBrócolis no vapor: 100g\nAzeite de oliva: 1 colher de chá\nPáprica, alho e sal: a gosto',
        instructions:
          '1. Tempere o frango com alho, páprica e sal.\n2. Grelhe o frango em frigideira antiaderente até dourar.\n3. Cozinhe a batata doce no vapor até ficar macia.\n4. Monte o prato com o brócolis e finalize com azeite.',
        calories: 430,
        protein: 42,
        carbs: 40,
        fat: 10,
        prep_time: 30,
        servings: 1,
      },
      {
        name: 'Salmão Assado com Legumes',
        description: 'Refeição rica em ômega-3 e fibras, com gorduras saudáveis para o coração.',
        category: 'almoco',
        ingredients:
          'Filé de salmão: 150g\nAbobrinha em rodelas: 100g\nCenoura em bastões: 100g\nAzeite de oliva: 1 colher de sopa\nLimão, sal e ervas finas: a gosto',
        instructions:
          '1. Pré-aqueça o forno a 200°C.\n2. Disponha o salmão e os legumes em uma assadeira.\n3. Regue com azeite, limão e tempere com ervas.\n4. Asse por 20 minutos até o salmão ficar opaco e macio.',
        calories: 410,
        protein: 36,
        carbs: 18,
        fat: 22,
        prep_time: 25,
        servings: 1,
      },
      // ---- Jantar ----
      {
        name: 'Wrap de Atum e Ricota',
        description: 'Jantar prático e leve, rico em proteínas e de fácil digestão noturna.',
        category: 'jantar',
        ingredients:
          'Tortilha integral: 1 unidade\nAtum em água: 1 lata (120g)\nRicota light: 40g\nRúcula: 30g\nTomate-cereja: 40g\nSal e pimenta: a gosto',
        instructions:
          '1. Escorra o atum e misture com a ricota temperada.\n2. Aqueça a tortilha rapidamente em uma frigideira.\n3. Recheie com a rúcula, tomate e a mistura de atum.\n4. Enrole firme e corte ao meio.',
        calories: 330,
        protein: 34,
        carbs: 26,
        fat: 11,
        prep_time: 10,
        servings: 1,
      },
      {
        name: 'Omelete de Forno com Legumes',
        description:
          'Omelete assada e recheada, fonte de proteína e micronutrientes para o jantar.',
        category: 'jantar',
        ingredients:
          'Ovos inteiros: 3 unidades\nClaras: 2 unidades\nEspinafre: 40g\nTomate picado: 50g\nQueijo cottage: 30g\nSal e orégano: a gosto',
        instructions:
          '1. Pré-aqueça o forno a 180°C.\n2. Bata os ovos e claras com sal e orégano.\n3. Despeje em um refratário e adicione os legumes e o cottage.\n4. Asse por 20 minutos até dourar levemente.',
        calories: 290,
        protein: 30,
        carbs: 8,
        fat: 15,
        prep_time: 25,
        servings: 1,
      },
      // ---- Lanche ----
      {
        name: 'Pão Integral com Pasta de Amendoim',
        description: 'Lanche energético e prático, com boas gorduras e carboidratos complexos.',
        category: 'lanche',
        ingredients:
          'Pão integral: 2 fatias\nPasta de amendoim integral: 20g\nBanana em rodelas: 1 unidade\nCanela em pó: a gosto',
        instructions:
          '1. Torre levemente as fatias de pão.\n2. Espalhe a pasta de amendoim.\n3. Cubra com as rodelas de banana e polvilhe canela.',
        calories: 310,
        protein: 11,
        carbs: 44,
        fat: 12,
        prep_time: 5,
        servings: 1,
      },
      {
        name: 'Bolinho de Banana Fit',
        description:
          'Lanche doce sem açúcar refinado, ótimo para matar a vontade de forma saudável.',
        category: 'lanche',
        ingredients:
          'Banana madura: 2 unidades\nAveia em flocos: 60g\nOvo: 1 unidade\nCacau em pó 100%: 10g\nMel: 1 colher de chá\nFermento: 1 colher de chá',
        instructions:
          '1. Amasse as bananas e misture o ovo e o mel.\n2. Adicione a aveia, o cacau e o fermento.\n3. Despeje em forminhas e asse a 180°C por 20 minutos.',
        calories: 260,
        protein: 8,
        carbs: 48,
        fat: 5,
        prep_time: 25,
        servings: 4,
      },
      // ---- Shake ----
      {
        name: 'Smoothie Bowl de Frutas Vermelhas',
        description: 'Tigela cremosa e refrescante, rica em antioxidantes e fibras.',
        category: 'shake',
        ingredients:
          'Frutas vermelhas congeladas: 120g\nIogurte grego natural: 150g\nWhey protein sem sabor: 20g\nGranola sem açúcar: 20g\nMel: 1 colher de chá',
        instructions:
          '1. Bata as frutas com o iogurte e o whey até ficar cremoso.\n2. Despeje em uma tigela.\n3. Finalize com a granola e o mel.',
        calories: 330,
        protein: 28,
        carbs: 38,
        fat: 6,
        prep_time: 10,
        servings: 1,
      },
      {
        name: 'Shake Verde Detox',
        description:
          'Shake funcional e leve, com clorofila e vitaminas para hidratar e desinflamar.',
        category: 'shake',
        ingredients:
          'Couve: 1 folha\nMaçã verde: 1 unidade\nPepino: 50g\nLimão: suco de 1 unidade\nÁgua de coco: 200ml\nGengibre: a gosto',
        instructions:
          '1. Lave bem a couve e o pepino.\n2. Bata tudo no liquidificador com a água de coco.\n3. Coe se preferir e beba em seguida.',
        calories: 150,
        protein: 3,
        carbs: 32,
        fat: 1,
        prep_time: 5,
        servings: 1,
      },
    ]

    for (const recData of recipeList) {
      try {
        app.findFirstRecordByData('recipes', 'name', recData.name)
      } catch (_) {
        const recipe = new Record(recipesCol)
        recipe.set('name', recData.name)
        recipe.set('description', recData.description)
        recipe.set('category', recData.category)
        recipe.set('ingredients', recData.ingredients)
        recipe.set('instructions', recData.instructions)
        recipe.set('calories', recData.calories)
        recipe.set('protein', recData.protein)
        recipe.set('carbs', recData.carbs)
        recipe.set('fat', recData.fat)
        recipe.set('prep_time', recData.prep_time)
        recipe.set('servings', recData.servings)
        app.save(recipe)
      }
    }
  },
  (app) => {
    // down: não remove para evitar perda de dados em re-rolls.
  },
)
