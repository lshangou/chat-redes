import Vue from 'vue'
import { io } from "socket.io-client";

Vue.prototype.$io = io;
