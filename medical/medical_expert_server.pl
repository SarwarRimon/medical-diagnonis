/* =====================================================
   MEDICAL EXPERT SYSTEM - HTTP SERVER
   Full-Stack Prolog Backend with REST API
   ===================================================== */

% Load required HTTP server libraries
:- use_module(library(http/thread_httpd)).
:- use_module(library(http/http_dispatch)).
:- use_module(library(http/http_json)).
:- use_module(library(http/http_cors)).
:- use_module(library(http/http_files)).

% Enable CORS globally for all origins
:- set_setting(http:cors, [*]).

% Dynamic facts for patient symptoms
:- dynamic patient_symptom/1.

% Set document root for static files
:- prolog_load_context(directory, Dir),
   asserta(user:file_search_path(document_root, Dir)).

/* -----------------------------------------------------
   HTTP SERVER CONFIGURATION
   ----------------------------------------------------- */

% Start the HTTP server on port 8080
start_server(Port) :-
    http_server(http_dispatch, [port(Port)]),
    format('~n==================================================~n'),
    format('  MEDICAL EXPERT SYSTEM - Server Started~n'),
    format('==================================================~n'),
    format('~n  Open in browser: http://localhost:~w/app~n', [Port]),
    format('~n  API Endpoints:~n'),
    format('    - GET  /app       : Web Interface~n'),
    format('    - POST /diagnose  : Run diagnosis~n'),
    format('    - GET  /symptoms  : List all symptoms~n'),
    format('    - GET  /health    : Health check~n'),
    format('~n  Ready to receive requests...~n~n').

% HTTP route handlers
:- http_handler(root(.), redirect_to_app, []).
:- http_handler(root(app), serve_frontend, []).
:- http_handler(root('style.css'), http_reply_file(document_root('style.css'), []), []).
:- http_handler(root('script.js'), http_reply_file(document_root('script.js'), []), []).
:- http_handler(root(diagnose), diagnose_handler, [cors]).
:- http_handler(root(symptoms), symptoms_handler, [cors]).
:- http_handler(root(health), health_handler, [cors]).
:- http_handler(root(disease_details), disease_details_handler, [cors]).

/* -----------------------------------------------------
   STATIC FILE HANDLER
   ----------------------------------------------------- */

redirect_to_app(_Request) :-
    http_redirect(moved, root(app), _).

serve_frontend(Request) :-
    http_reply_file(document_root('index.html'), [], Request).

/* -----------------------------------------------------
   DIAGNOSIS HANDLER
   ----------------------------------------------------- */

diagnose_handler(Request) :-
    http_read_json_dict(Request, Data),
    
    % Extract symptoms
    Symptoms = Data.symptoms,
    format(user_error, '~n📥 Received symptoms: ~w~n', [Symptoms]),
    
    % Clear and assert
    clear_patient_data,
    assert_symptoms(Symptoms),
    
    % Run diagnosis
    findall(
        _{disease: Disease, confidence: Confidence},
        diagnose(Disease, Confidence),
        AllResults
    ),
    
    % Sort by confidence descending and take top 5
    sort_by_confidence(AllResults, SortedResults),
    length(SortedResults, TotalCount),
    (TotalCount > 5 -> length(Results, 5), append(Results, _, SortedResults) ; Results = SortedResults),
    
    format(user_error, '📤 Diagnosis results: ~w~n~n', [Results]),
    clear_patient_data,
    
    % Return JSON (CORS handled automatically)
    reply_json_dict(_{results: Results}).

/* -----------------------------------------------------
   HEALTH CHECK
   ----------------------------------------------------- */

health_handler(_Request) :-
    reply_json_dict(_{
        status: "ok",
        message: "Medical Expert System is running",
        engine: "SWI-Prolog"
    }).

/* -----------------------------------------------------
   SYMPTOMS LIST HANDLER
   ----------------------------------------------------- */

symptoms_handler(_Request) :-
    findall(S, symptom(S), Symptoms),
    reply_json_dict(_{
        ok: true,
        symptoms: Symptoms
    }).

/* -----------------------------------------------------
   DISEASE DETAILS HANDLER
   ----------------------------------------------------- */

disease_details_handler(Request) :-
    http_read_json_dict(Request, Data),
    
    % Extract disease name and selected symptoms
    DiseaseName = Data.disease,
    SelectedSymptoms = Data.symptoms,
    
    % Convert disease name to atom
    atom_string(DiseaseAtom, DiseaseName),
    
    % Get disease requirements
    (disease(DiseaseAtom, RequiredSymptoms) ->
        % Convert selected symptoms to atoms
        findall(S, (member(S_str, SelectedSymptoms), atom_string(S, S_str)), SelectedAtoms),
        
        % Find matched symptoms
        findall(S, (member(S, RequiredSymptoms), member(S, SelectedAtoms)), MatchedSymptoms),
        
        % Find missing symptoms
        findall(S, (member(S, RequiredSymptoms), \+ member(S, SelectedAtoms)), MissingSymptoms),
        
        % Find contradicting symptoms (selected but not in disease requirements)
        findall(S, (member(S, SelectedAtoms), \+ member(S, RequiredSymptoms)), ContradictingSymptoms),
        
        % Format symptoms
        MatchedFormatted = MatchedSymptoms,
        MissingFormatted = MissingSymptoms,
        ContradictingFormatted = ContradictingSymptoms,
        
        reply_json_dict(_{
            disease: DiseaseName,
            matched_symptoms: MatchedFormatted,
            missing_symptoms: MissingFormatted,
            contradicting_symptoms: ContradictingFormatted
        })
    ;
        reply_json_dict(_{
            error: "Disease not found",
            disease: DiseaseName
        }, [status(404)])
    ).

/* -----------------------------------------------------
   HELPER PREDICATES
   ----------------------------------------------------- */

clear_patient_data :-
    retractall(patient_symptom(_)).

assert_symptoms([]).
assert_symptoms([Symptom|Rest]) :-
    atom_string(SymptomAtom, Symptom),
    assertz(patient_symptom(SymptomAtom)),
    assert_symptoms(Rest).

% Sort results by confidence in descending order
sort_by_confidence(Results, Sorted) :-
    msort(Results, TempSorted),
    reverse(TempSorted, Sorted).

/* -----------------------------------------------------
   MEDICAL KNOWLEDGE BASE
   ----------------------------------------------------- */

% General Symptoms
symptom(fatigue).
symptom(fever).
symptom(weight_loss).
symptom(loss_of_appetite).
symptom(night_sweats).
symptom(chills).
symptom(body_aches).
symptom(weakness).

% Digestive Symptoms
symptom(nausea_and_vomiting).
symptom(diarrhea).
symptom(constipation).
symptom(bloating_and_gas).
symptom(heartburn).
symptom(difficulty_swallowing).
symptom(loss_of_appetite).

% Abdominal Symptoms
symptom(pain_in_the_belly).
symptom(severe_pain_in_the_belly).
symptom(swelling_of_the_abdomen).
symptom(loud_bowel_sounds).
symptom(cramping).

% Stool & Blood Related
symptom(blood_in_your_stool).
symptom(dark_colored_stools).
symptom(low_red_blood_cell_counts).
symptom(pale_stools).

% Skin & Appearance
symptom(yellowing_of_skin_and_eyes).
symptom(skin_rash).
symptom(itchy_skin).
symptom(pale_skin).

% Respiratory
symptom(cough).
symptom(shortness_of_breath).
symptom(chest_pain).
symptom(wheezing).
symptom(sore_throat).
symptom(runny_nose).

% Neurological
symptom(headache).
symptom(dizziness).
symptom(confusion).
symptom(numbness_or_tingling).

% Oral
symptom(mouth_sores).
symptom(bad_breath).
symptom(dry_mouth).

% Urinary
symptom(frequent_urination).
symptom(painful_urination).
symptom(blood_in_urine).
symptom(dark_urine).

% Musculoskeletal
symptom(joint_pain).
symptom(muscle_pain).
symptom(back_pain).
symptom(stiff_neck).

% Other
symptom(swollen_lymph_nodes).
symptom(excessive_thirst).
symptom(blurred_vision).

/* -----------------------------------------------------
   DISEASE DATABASE (Expanded)
   ----------------------------------------------------- */

% Gastrointestinal Diseases
disease(intestinal_cancer, 
    [pain_in_the_belly, nausea_and_vomiting, weight_loss, fatigue,
     dark_colored_stools, low_red_blood_cell_counts, yellowing_of_skin_and_eyes,
     loss_of_appetite, blood_in_your_stool]).

disease(crohns_disease,
    [diarrhea, fever, fatigue, blood_in_your_stool,
     mouth_sores, weight_loss, pain_in_the_belly, loss_of_appetite]).

disease(celiac_disease,
    [diarrhea, fatigue, weight_loss, bloating_and_gas,
     pain_in_the_belly, nausea_and_vomiting, skin_rash, joint_pain]).

disease(intestinal_obstruction,
    [severe_pain_in_the_belly, nausea_and_vomiting, bloating_and_gas,
     loud_bowel_sounds, swelling_of_the_abdomen, constipation]).

disease(gastritis,
    [pain_in_the_belly, nausea_and_vomiting, bloating_and_gas,
     loss_of_appetite, heartburn, dark_colored_stools]).

disease(peptic_ulcer,
    [pain_in_the_belly, heartburn, nausea_and_vomiting, bloating_and_gas,
     weight_loss, dark_colored_stools, loss_of_appetite]).

disease(irritable_bowel_syndrome,
    [pain_in_the_belly, bloating_and_gas, diarrhea, constipation,
     cramping, nausea_and_vomiting]).

disease(gastroesophageal_reflux,
    [heartburn, difficulty_swallowing, chest_pain, cough,
     nausea_and_vomiting, bad_breath]).

% Liver Diseases
disease(hepatitis,
    [fatigue, yellowing_of_skin_and_eyes, pain_in_the_belly, dark_urine,
     pale_stools, nausea_and_vomiting, loss_of_appetite, fever, joint_pain]).

disease(cirrhosis,
    [fatigue, yellowing_of_skin_and_eyes, swelling_of_the_abdomen, itchy_skin,
     weight_loss, nausea_and_vomiting, confusion, dark_urine]).

disease(fatty_liver_disease,
    [fatigue, pain_in_the_belly, weight_loss, weakness,
     yellowing_of_skin_and_eyes, swelling_of_the_abdomen]).

% Infectious Diseases
disease(common_cold,
    [runny_nose, sore_throat, cough, fever, headache,
     body_aches, fatigue, chills]).

disease(influenza,
    [fever, body_aches, fatigue, cough, sore_throat,
     headache, chills, weakness, runny_nose]).

disease(food_poisoning,
    [nausea_and_vomiting, diarrhea, fever, pain_in_the_belly,
     cramping, weakness, chills, headache]).

disease(gastroenteritis,
    [diarrhea, nausea_and_vomiting, fever, pain_in_the_belly,
     cramping, headache, body_aches, fatigue]).

disease(typhoid_fever,
    [fever, headache, pain_in_the_belly, weakness, fatigue,
     loss_of_appetite, diarrhea, constipation, skin_rash]).

disease(malaria,
    [fever, chills, headache, body_aches, fatigue,
     nausea_and_vomiting, sweating, weakness]).

% Respiratory Diseases
disease(pneumonia,
    [fever, cough, shortness_of_breath, chest_pain, fatigue,
     chills, nausea_and_vomiting, confusion]).

disease(bronchitis,
    [cough, fatigue, shortness_of_breath, chest_pain,
     fever, chills, sore_throat, body_aches]).

disease(asthma,
    [shortness_of_breath, wheezing, cough, chest_pain]).

% Metabolic Diseases
disease(diabetes,
    [excessive_thirst, frequent_urination, fatigue, blurred_vision,
     weight_loss, numbness_or_tingling, slow_healing_wounds]).

disease(anemia,
    [fatigue, weakness, pale_skin, shortness_of_breath,
     dizziness, headache, chest_pain, low_red_blood_cell_counts]).

% Kidney Diseases
disease(kidney_infection,
    [fever, back_pain, painful_urination, frequent_urination,
     blood_in_urine, nausea_and_vomiting, chills]).

disease(kidney_stones,
    [severe_pain_in_the_belly, back_pain, painful_urination,
     blood_in_urine, nausea_and_vomiting, fever]).

% Autoimmune
disease(rheumatoid_arthritis,
    [joint_pain, fatigue, fever, weakness, weight_loss,
     stiff_neck, numbness_or_tingling]).

disease(lupus,
    [fatigue, fever, joint_pain, skin_rash, headache,
     mouth_sores, hair_loss, chest_pain]).

% Neurological
disease(migraine,
    [headache, nausea_and_vomiting, blurred_vision, dizziness,
     sensitivity_to_light]).

disease(meningitis,
    [severe_headache, fever, stiff_neck, nausea_and_vomiting,
     confusion, sensitivity_to_light, skin_rash]).

/* -----------------------------------------------------
   INFERENCE ENGINE
   ----------------------------------------------------- */

count_match([], 0).
count_match([Symptom|Rest], Count) :-
    patient_symptom(Symptom), !,
    count_match(Rest, RestCount),
    Count is RestCount + 1.
count_match([_|Rest], Count) :-
    count_match(Rest, Count).

confidence(Disease, Confidence) :-
    disease(Disease, RequiredSymptoms),
    length(RequiredSymptoms, TotalSymptoms),
    count_match(RequiredSymptoms, MatchCount),
    MatchCount > 0,
    Confidence is (MatchCount / TotalSymptoms) * 100.

% Show results even with low matches (threshold lowered to 10%)
diagnose(Disease, RoundedConfidence) :-
    confidence(Disease, Confidence),
    Confidence >= 10,
    RoundedConfidence is round(Confidence * 10) / 10.

/* -----------------------------------------------------
   SERVER STARTUP
   ----------------------------------------------------- */

:- initialization(start_server(8080)).
