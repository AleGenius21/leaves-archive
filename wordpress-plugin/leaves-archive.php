<?php
/**
 * Plugin Name: Leaves Archive
 * Plugin URI: https://example.com/leaves-archive
 * Description: Modulo standalone per la gestione dell'archivio ferie/permessi
 * Version: 1.0.0
 * Author: Your Name
 * Author URI: https://example.com
 * Text Domain: leaves-archive
 * Domain Path: /languages
 * Requires at least: 5.0
 * Requires PHP: 7.4
 */

// Prevenire accesso diretto
if (!defined('ABSPATH')) {
    exit;
}

// Definisci costanti del plugin
define('LEAVES_ARCHIVE_VERSION', '1.0.0');
define('LEAVES_ARCHIVE_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('LEAVES_ARCHIVE_PLUGIN_URL', plugin_dir_url(__FILE__));
define('LEAVES_ARCHIVE_ASSETS_URL', LEAVES_ARCHIVE_PLUGIN_URL . 'assets/');
define('LEAVES_ARCHIVE_COMPONENTS_URL', LEAVES_ARCHIVE_ASSETS_URL . 'components/');

/**
 * Verifica versione Bootstrap nel tema
 * Ritorna: '4', '5', o false se non trovato
 */
function leaves_archive_check_bootstrap_version() {
    global $wp_styles;
    
    // Cerca Bootstrap nei CSS già registrati
    if (isset($wp_styles->registered)) {
        foreach ($wp_styles->registered as $handle => $style) {
            if (strpos($handle, 'bootstrap') !== false || 
                (isset($style->src) && strpos($style->src, 'bootstrap') !== false)) {
                // Prova a determinare la versione dal handle o src
                if (strpos($handle, 'bootstrap5') !== false || 
                    strpos($style->src, 'bootstrap@5') !== false ||
                    strpos($style->src, 'bootstrap/5') !== false) {
                    return '5';
                }
                if (strpos($handle, 'bootstrap4') !== false || 
                    strpos($style->src, 'bootstrap@4') !== false ||
                    strpos($style->src, 'bootstrap/4') !== false) {
                    return '4';
                }
            }
        }
    }
    
    return false;
}

/**
 * Registra e carica gli stili CSS
 */
function leaves_archive_enqueue_styles() {
    // Verifica se Bootstrap 5 è già caricato
    $bootstrap_version = leaves_archive_check_bootstrap_version();
    $needs_bootstrap = ($bootstrap_version !== '5');
    
    // Carica Bootstrap 5 CSS solo se necessario
    if ($needs_bootstrap) {
        wp_enqueue_style(
            'bootstrap-5',
            'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
            array(),
            '5.3.2'
        );
    }
    
    // Bootstrap Icons (sempre necessario)
    wp_enqueue_style(
        'bootstrap-icons',
        'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css',
        array(),
        '1.11.1'
    );
    
    // Flatpickr CSS
    wp_enqueue_style(
        'flatpickr',
        'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css',
        array(),
        '4.6.13'
    );
    
    // CSS personalizzati del modulo (con namespace)
    wp_enqueue_style(
        'leaves-archive-main',
        LEAVES_ARCHIVE_ASSETS_URL . 'css/main.css',
        array(),
        LEAVES_ARCHIVE_VERSION
    );
    
    wp_enqueue_style(
        'leaves-archive-approval-row',
        LEAVES_ARCHIVE_COMPONENTS_URL . 'approval-row/style.css',
        array('leaves-archive-main'),
        LEAVES_ARCHIVE_VERSION
    );
    
    wp_enqueue_style(
        'leaves-archive-filters',
        LEAVES_ARCHIVE_COMPONENTS_URL . 'filters/filters.css',
        array('leaves-archive-main'),
        LEAVES_ARCHIVE_VERSION
    );
    
    wp_enqueue_style(
        'leaves-archive-detail-panel',
        LEAVES_ARCHIVE_COMPONENTS_URL . 'detail-panel/detail-panel.css',
        array('leaves-archive-main'),
        LEAVES_ARCHIVE_VERSION
    );
}

/**
 * Registra e carica gli script JavaScript
 */
function leaves_archive_enqueue_scripts() {
    // Verifica se Bootstrap 5 JS è già caricato
    global $wp_scripts;
    $bootstrap_js_loaded = false;
    
    if (isset($wp_scripts->registered)) {
        foreach ($wp_scripts->registered as $handle => $script) {
            if (strpos($handle, 'bootstrap') !== false && 
                (isset($script->src) && strpos($script->src, 'bootstrap.bundle') !== false)) {
                $bootstrap_js_loaded = true;
                break;
            }
        }
    }
    
    // Carica Bootstrap 5 JS Bundle solo se necessario
    if (!$bootstrap_js_loaded) {
        wp_enqueue_script(
            'bootstrap-5-bundle',
            'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js',
            array(),
            '5.3.2',
            true
        );
    }
    
    // Flatpickr JS
    wp_enqueue_script(
        'flatpickr',
        'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.js',
        array(),
        '4.6.13',
        true
    );
    
    wp_enqueue_script(
        'flatpickr-it',
        'https://cdn.jsdelivr.net/npm/flatpickr/dist/l10n/it.js',
        array('flatpickr'),
        '4.6.13',
        true
    );
    
    // Component JS
    wp_enqueue_script(
        'leaves-archive-approval-row',
        LEAVES_ARCHIVE_COMPONENTS_URL . 'approval-row/script.js',
        array(),
        LEAVES_ARCHIVE_VERSION,
        true
    );
    
    wp_enqueue_script(
        'leaves-archive-filters',
        LEAVES_ARCHIVE_COMPONENTS_URL . 'filters/filters.js',
        array('flatpickr', 'flatpickr-it'),
        LEAVES_ARCHIVE_VERSION,
        true
    );
    
    wp_enqueue_script(
        'leaves-archive-detail-panel',
        LEAVES_ARCHIVE_COMPONENTS_URL . 'detail-panel/detail-panel.js',
        array(),
        LEAVES_ARCHIVE_VERSION,
        true
    );
    
    // Main JS (deve essere l'ultimo)
    wp_enqueue_script(
        'leaves-archive-main',
        LEAVES_ARCHIVE_ASSETS_URL . 'js/main.js',
        array('leaves-archive-approval-row', 'leaves-archive-filters', 'leaves-archive-detail-panel'),
        LEAVES_ARCHIVE_VERSION,
        true
    );
    
    // Passa URL dei componenti a JavaScript
    wp_localize_script('leaves-archive-main', 'leavesArchive', array(
        'pluginUrl' => LEAVES_ARCHIVE_ASSETS_URL,
        'componentsUrl' => LEAVES_ARCHIVE_COMPONENTS_URL,
        'filtersHtmlUrl' => LEAVES_ARCHIVE_COMPONENTS_URL . 'filters/filters.html',
        'detailPanelHtmlUrl' => LEAVES_ARCHIVE_COMPONENTS_URL . 'detail-panel/detail-panel.html'
    ));
}

/**
 * Shortcode principale
 */
function leaves_archive_shortcode($atts) {
    // Carica CSS e JS solo quando lo shortcode è presente
    leaves_archive_enqueue_styles();
    leaves_archive_enqueue_scripts();
    
    // Genera HTML del modulo con wrapper isolante
    ob_start();
    ?>
    <div class="leaves-archive-wrapper">
        <div class="container-fluid pt-3 pb-0 px-0">
            <!-- Filter Bar Component Container - occupa tutta la larghezza -->
            <div id="filterBarContainer">
                <!-- Il componente filter bar verrà caricato dinamicamente qui -->
            </div>

            <div class="main-container">
                <!-- Sezione lista (sinistra) -->
                <div class="list-section" id="listSection">
                    <div class="approval-list px-3" id="approvalList">
                        <!-- Le righe verranno generate dinamicamente via JavaScript -->
                    </div>
                </div>

                <!-- Detail Panel (destra) -->
                <div id="detail-panel" class="detail-panel">
                    <!-- Il contenuto verrà caricato dinamicamente da detail-panel.html -->
                </div>
            </div>
        </div>
    </div>
    <?php
    return ob_get_clean();
}

// Registra lo shortcode
add_shortcode('leaves-archive', 'leaves_archive_shortcode');

