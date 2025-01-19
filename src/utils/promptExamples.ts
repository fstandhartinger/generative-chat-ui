export const HTML_EXAMPLES = {
  southeastAsia: `<div id="travel-weather-map-container" style="width: 100%; height: 100vh; position: relative; font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;">
    <!-- Map and controls container -->
    <div id="map" style="width: 100%; height: 600px;"></div>
    
    <!-- Legend -->
    <div style="position: absolute; top: 10px; right: 10px; background: white; padding: 10px; border-radius: 4px; box-shadow: 0 0 10px rgba(0,0,0,0.2); color: #333;">
        <h3 style="margin: 0 0 10px 0;">August Travel Conditions</h3>
        <div style="display: flex; align-items: center; margin: 5px 0;">
            <div style="width: 20px; height: 20px; background: #00ff00; border-radius: 50%; margin-right: 10px;"></div>
            <span>Ideal</span>
        </div>
        <div style="display: flex; align-items: center; margin: 5px 0;">
            <div style="width: 20px; height: 20px; background: #ffff00; border-radius: 50%; margin-right: 10px;"></div>
            <span>Acceptable</span>
        </div>
        <div style="display: flex; align-items: center; margin: 5px 0;">
            <div style="width: 20px; height: 20px; background: #ff0000; border-radius: 50%; margin-right: 10px;"></div>
            <span>Unfavorable</span>
        </div>
    </div>

    <!-- Load OpenLayers from CDN -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/openlayers/openlayers.github.io@master/en/v6.9.0/css/ol.css">
    <script src="https://cdn.jsdelivr.net/gh/openlayers/openlayers.github.io@master/en/v6.9.0/build/ol.js"></script>

    <style>
        .ol-popup {
            position: absolute;
            background-color: white;
            box-shadow: 0 1px 4px rgba(0,0,0,0.2);
            padding: 15px;
            border-radius: 10px;
            border: 1px solid #cccccc;
            bottom: 12px;
            left: -50px;
            min-width: 280px;
            color: #333;
        }
    </style>

    <script>
        // Weather data for Southeast Asian destinations in August
        const locations = [
            {
                name: "Bali, Indonesia",
                coordinates: [115.188919, -8.409518],
                condition: "green",
                description: "Dry season: Low rainfall, average temp 27°C, moderate humidity"
            },
            {
                name: "Bangkok, Thailand",
                coordinates: [100.501765, 13.756331],
                condition: "yellow",
                description: "Wet season but manageable: Occasional showers, average temp 29°C, high humidity"
            },
            {
                name: "Hanoi, Vietnam",
                coordinates: [105.854359, 21.028511],
                condition: "red",
                description: "Peak monsoon: Heavy rainfall, average temp 30°C, very high humidity"
            },
            {
                name: "Singapore",
                coordinates: [103.819836, 1.352083],
                condition: "yellow",
                description: "Inter-monsoon: Brief showers, average temp 28°C, high humidity"
            },
            {
                name: "Kuching, Malaysia",
                coordinates: [110.344666, 1.557177],
                condition: "red",
                description: "Monsoon season: Heavy rainfall, average temp 31°C, very high humidity"
            },
            {
                name: "Cebu, Philippines",
                coordinates: [123.885437, 10.315699],
                condition: "yellow",
                description: "Wet season but moderate: Scattered rainfall, average temp 29°C, high humidity"
            },
            {
                name: "Chiang Mai, Thailand",
                coordinates: [98.986761, 18.787747],
                condition: "red",
                description: "Peak monsoon: Heavy rainfall, average temp 28°C, very high humidity"
            },
            {
                name: "Lombok, Indonesia",
                coordinates: [116.328111, -8.650979],
                condition: "green",
                description: "Dry season: Minimal rainfall, average temp 26°C, moderate humidity"
            }
        ];

        // Initialize the map
        const map = new ol.Map({
            target: 'map',
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM()
                })
            ],
            view: new ol.View({
                center: ol.proj.fromLonLat([105, 10]), // Center on Southeast Asia
                zoom: 5
            })
        });

        // Create features for each location
        const features = locations.map(location => {
            const feature = new ol.Feature({
                geometry: new ol.geom.Point(
                    ol.proj.fromLonLat(location.coordinates)
                ),
                name: location.name,
                description: location.description,
                condition: location.condition
            });

            // Style based on condition
            const color = location.condition === 'green' ? '#00ff00' : 
                         location.condition === 'yellow' ? '#ffff00' : '#ff0000';

            feature.setStyle(new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 8,
                    fill: new ol.style.Fill({color: color}),
                    stroke: new ol.style.Stroke({
                        color: '#fff',
                        width: 2
                    })
                })
            }));

            return feature;
        });

        // Add features to the map
        const vectorSource = new ol.source.Vector({
            features: features
        });

        const vectorLayer = new ol.layer.Vector({
            source: vectorSource
        });

        map.addLayer(vectorLayer);

        // Add popup overlay
        const popup = new ol.Overlay({
            element: document.createElement('div'),
            positioning: 'bottom-center',
            offset: [0, -10]
        });
        popup.getElement().className = 'ol-popup';
        popup.getElement().style.backgroundColor = 'white';
        popup.getElement().style.padding = '10px';
        popup.getElement().style.borderRadius = '4px';
        popup.getElement().style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
        popup.getElement().style.color = '#333';
        map.addOverlay(popup);

        // Show popup on click
        map.on('click', function(evt) {
            const feature = map.forEachFeatureAtPixel(evt.pixel, function(feature) {
                return feature;
            });

            if (feature) {
                const coordinates = feature.getGeometry().getCoordinates();
                popup.setPosition(coordinates);
                popup.getElement().innerHTML = \`
                    <strong>\${feature.get('name')}</strong><br>
                    \${feature.get('description')}
                \`;
            } else {
                popup.setPosition(undefined);
            }
        });
    </script>
</div>`,

  germanSalary: `<div id="salary-calculator" class="p-6 bg-gray-800 rounded-lg">
    <div class="space-y-4">
      <div>
        <label for="grossSalary" class="block text-gray-200">Annual Gross Salary (€)</label>
        <input type="number" id="grossSalary" class="w-full p-2 bg-gray-700 border border-gray-600 rounded text-gray-200" />
      </div>
      <div>
        <label for="taxClass" class="block text-gray-200">Tax Class</label>
        <select id="taxClass" class="w-full p-2 bg-gray-700 border border-gray-600 rounded text-gray-200">
          <option value="1">Class 1</option>
          <option value="2">Class 2</option>
          <option value="3">Class 3</option>
          <option value="4">Class 4</option>
          <option value="5">Class 5</option>
          <option value="6">Class 6</option>
        </select>
      </div>
      <div>
        <label class="flex items-center space-x-2">
          <input type="checkbox" id="churchTax" class="w-4 h-4 bg-gray-700 border-gray-600 rounded" />
          <span class="text-gray-200">Church Tax</span>
        </label>
      </div>
      <button onclick="calculateSalary()" class="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Calculate
      </button>
      <div id="result" class="mt-4 p-4 bg-gray-700 rounded hidden">
        <!-- Results will be inserted here -->
      </div>
    </div>
    <script>
      function calculateSalary() {
        const grossSalary = parseFloat(document.getElementById('grossSalary').value);
        const taxClass = document.getElementById('taxClass').value;
        const churchTax = document.getElementById('churchTax').checked;
        
        if (!grossSalary || isNaN(grossSalary)) {
          alert('Please enter a valid gross salary');
          return;
        }
        
        // Simplified German tax calculation (example rates)
        const incomeTaxRate = 0.42; // 42% for high earners
        const solidarityRate = 0.055; // 5.5%
        const churchTaxRate = 0.09; // 9%
        const socialSecurityRate = 0.20; // 20% total for health, pension, etc.
        
        const incomeTax = grossSalary * incomeTaxRate;
        const solidarityTax = incomeTax * solidarityRate;
        const churchTaxAmount = churchTax ? incomeTax * churchTaxRate : 0;
        const socialSecurity = Math.min(grossSalary * socialSecurityRate, 15000); // Cap at 15,000€
        
        const totalDeductions = incomeTax + solidarityTax + churchTaxAmount + socialSecurity;
        const netSalary = grossSalary - totalDeductions;
        
        const resultDiv = document.getElementById('result');
        resultDiv.innerHTML = \`
          <h3 class="text-xl font-bold text-gray-200 mb-3">Annual Breakdown</h3>
          <div class="space-y-2 text-gray-200">
            <p>Gross Salary: €\${grossSalary.toFixed(2)}</p>
            <p>Income Tax: €\${incomeTax.toFixed(2)}</p>
            <p>Solidarity Tax: €\${solidarityTax.toFixed(2)}</p>
            \${churchTax ? \`<p>Church Tax: €\${churchTaxAmount.toFixed(2)}</p>\` : ''}
            <p>Social Security: €\${socialSecurity.toFixed(2)}</p>
            <p class="text-lg font-bold mt-4">Net Salary: €\${netSalary.toFixed(2)}</p>
            <p class="text-sm text-gray-400">Monthly Net: €\${(netSalary / 12).toFixed(2)}</p>
          </div>
        \`;
        resultDiv.classList.remove('hidden');
      }
    </script>
</div>`,

  songEvaluation: `<div id="songEvaluator">
    <style>
        #songEvaluator {
            background-color: #343541;
            color: #ECECF1;
            font-family: system-ui, -apple-system, sans-serif;
            padding: 2rem;
            border-radius: 8px;
            max-width: 600px;
            margin: 2rem auto;
        }

        #songEvaluator h2 {
            color: #FFFFFF;
            margin-bottom: 1.5rem;
        }

        #songEvaluator .category {
            margin-bottom: 1.5rem;
            background-color: #444654;
            padding: 1rem;
            border-radius: 6px;
        }

        #songEvaluator label {
            display: block;
            margin-bottom: 0.5rem;
        }

        #songEvaluator .radio-group {
            display: flex;
            gap: 1rem;
        }

        #songEvaluator .radio-option {
            display: flex;
            align-items: center;
            gap: 0.3rem;
        }

        #songEvaluator .buttons {
            display: flex;
            gap: 1rem;
            margin-top: 2rem;
        }

        #songEvaluator button {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 600;
            transition: opacity 0.2s;
        }

        #songEvaluator button:hover {
            opacity: 0.9;
        }

        #songEvaluator #acceptBtn {
            background-color: #19C37D;
            color: white;
        }

        #songEvaluator #rejectBtn {
            background-color: #DC2626;
            color: white;
        }

        #songEvaluator #result {
            margin-top: 1.5rem;
            white-space: pre-wrap;
            background-color: #444654;
            padding: 1rem;
            border-radius: 6px;
            display: none;
        }
    </style>

    <h2>Song Evaluation Form</h2>
    
    <div class="category">
        <label>Melody:</label>
        <div class="radio-group">
            <div class="radio-option">
                <input type="radio" name="melody" value="good" id="melodyGood">
                <label for="melodyGood">Good</label>
            </div>
            <div class="radio-option">
                <input type="radio" name="melody" value="bad" id="melodyBad">
                <label for="melodyBad">Bad</label>
            </div>
        </div>
    </div>

    <div class="category">
        <label>Vocals:</label>
        <div class="radio-group">
            <div class="radio-option">
                <input type="radio" name="vocals" value="good" id="vocalsGood">
                <label for="vocalsGood">Good</label>
            </div>
            <div class="radio-option">
                <input type="radio" name="vocals" value="bad" id="vocalsBad">
                <label for="vocalsBad">Bad</label>
            </div>
        </div>
    </div>

    <div class="category">
        <label>Beat:</label>
        <div class="radio-group">
            <div class="radio-option">
                <input type="radio" name="beat" value="good" id="beatGood">
                <label for="beatGood">Good</label>
            </div>
            <div class="radio-option">
                <input type="radio" name="beat" value="bad" id="beatBad">
                <label for="beatBad">Bad</label>
            </div>
        </div>
    </div>

    <div class="buttons">
        <button id="acceptBtn">Accept</button>
        <button id="rejectBtn">Reject</button>
    </div>

    <div id="result"></div>

    <script>
        const generatePrompt = (melody, vocals, beat, decision) => {
            return \`Create a polite \${decision} of the song that has applied to get taken into my spotify playlist. Include the information that I think the melody is \${melody}, the vocals are \${vocals} and the beat is \${beat}.\`;
        };

        const fetchResponse = async (prompt) => {
            try {
                const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer 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'
                    },
                    body: JSON.stringify({
                        messages: [
                            {
                                role: 'user',
                                content: prompt
                            }
                        ],
                        model: 'llama-3.3-70b-versatile',
                        temperature: 1,
                        max_completion_tokens: 1024,
                        top_p: 1,
                        stream: false,
                        stop: null
                    })
                });

                const data = await response.json();
                return data.choices[0].message.content;
            } catch (error) {
                return 'Error generating response. Please try again.';
            }
        };

        const handleDecision = async (decision) => {
            const melody = document.querySelector('input[name="melody"]:checked')?.value;
            const vocals = document.querySelector('input[name="vocals"]:checked')?.value;
            const beat = document.querySelector('input[name="beat"]:checked')?.value;

            if (!melody || !vocals || !beat) {
                alert('Please rate all categories before making a decision.');
                return;
            }

            const resultDiv = document.getElementById('result');
            resultDiv.style.display = 'block';
            resultDiv.textContent = 'Generating response...';

            const prompt = generatePrompt(melody, vocals, beat, decision);
            const response = await fetchResponse(prompt);
            resultDiv.textContent = response;
        };

        document.getElementById('acceptBtn').addEventListener('click', () => handleDecision('acceptance'));
        document.getElementById('rejectBtn').addEventListener('click', () => handleDecision('rejection'));
    </script>
</div>`
};

export const getSystemPrompt = () => `You are an AI assistant that responds with either text or HTML fragments. 
          
IMPORTANT: When deciding between text and HTML responses, ALWAYS prefer HTML fragments.
This application demonstrates that LLM chat apps can respond with generative UI instead of just text.

When creating HTML fragments, ensure they are:
1. Completely self-contained with ALL required functionality:
   - Include ALL necessary JavaScript code
   - Load required libraries from CDNs (e.g., OpenLayers for maps)
   - Handle all interactions within the fragment
2. Match the dark theme (bg-gray-800, text-gray-200, etc.)
3. Use modern, rounded UI elements with proper padding/spacing
4. Include error handling and validation
5. Provide clear feedback for user interactions
6. Use semantic HTML and ARIA attributes

Specific requirements for common scenarios:

1. For maps (e.g., Southeast Asia regions):
   Use this example:
   ${HTML_EXAMPLES.southeastAsia}

2. For calculators (e.g., German net salary):
   Use this example:
   ${HTML_EXAMPLES.germanSalary}

3. For evaluations (e.g., song reviews):
   Use this example:
   ${HTML_EXAMPLES.songEvaluation}

Format your response as a JSON object:
{
  "responsetype": "text" or "html",
  "response": "your response content"
}`;

