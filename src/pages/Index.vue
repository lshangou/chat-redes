<template>
  <q-page>
    <div class="q-pa-sm">
      <q-input label="Seu Nome: (Obrigatório para enviar uma mensagem.)" v-model="name"></q-input>
    </div>
    <ul id="messages"></ul>
    <form id="form" action="" class="q-pa-sm fixed-bottom">
      <q-input class="full-width" :label="'Mensagem (como ' + name + ')...'" v-model="msg">
        <template v-slot:after>
          <q-btn color="primary" label="Enviar" @click="enviarMensagem()" class="cursor-pointer" />
        </template>
      </q-input>
    </form>
  </q-page>
</template>

<script>
export default {
  name: 'PageIndex',
  data () {
    return {
      name: "",
      msg: "",
      socket: null
    }
  },
  created () {
    this.socket = this.$io("http://localhost:7777");
    this.socket.on('chat message', function(obj) {
      var item = document.createElement('li');
      item.textContent = obj.name + ' - ' + obj.msg;
      document.getElementById('messages').appendChild(item);
      window.scrollTo(0, document.body.scrollHeight);
    });
  },
  methods: {
    enviarMensagem() {
      if(this.msg != "" && this.name != "") {
        this.socket.emit('chat message', {name: this.name, msg: this.msg});
        this.msg = "";
      }
    }
  }
}
</script>
