import './bootstrap';
import '../css/app.css';

import { createApp, h } from 'vue';
import { createInertiaApp } from '@inertiajs/vue3';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { ZiggyVue } from '../../vendor/tightenco/ziggy';
import store from './store';
import Vuex from "vuex";
import vuetify from "./vuetify";
import fetchInterceptor from './fetchInterceptor';
import CountryFlag from 'vue-country-flag-next';
import moment from "moment";

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${appName} - ${title}`,
    resolve: (name) => resolvePageComponent(`./Pages/${name}.vue`, import.meta.glob('./Pages/**/*.vue')),
    setup({ el, App, props, plugin }) {
        return createApp({ render: () => h(App, props) })
            .use(plugin)
            .use(ZiggyVue)
            .use(fetchInterceptor)
            .use(CountryFlag)
            .use(Vuex)
            .use(store)
            .mixin({
                methods: {
                    formatDateTime(value) {
                        if (!value) return "";
                        return moment(value).format("DD/MM/YYYY HH:mm");
                    },
                },
            })
            .use(vuetify)
            .mount(el);
    },
    progress: {
        color: '#4B5563',
    },
});
