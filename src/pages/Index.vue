<template>
  <q-page>
    <q-page-sticky position="bottom-left" :offset="[18, 200]">
      <q-btn round color="accent" icon="arrow_back" class="rotate-270" @click="scrollBottom()" />
    </q-page-sticky>
    <q-page-sticky position="top-left" :offset="[18, 18]">
      <q-btn round color="red-5" icon="delete" @click="deleteAllPrompt = true" />
    </q-page-sticky>
    <div id="messages" class="q-px-md">
      <div v-for="message in messages" :key="message.time">
        <q-chat-message class="message-text"
          :sent="message.name == name"
          :name="message.name"
          :text="[message.msg]"
          :avatar="message.image"
          :stamp="new Date(message.time).getHours() + ':' + new Date(message.time).getMinutes().toString()">
        </q-chat-message>
        <q-btn v-if="message.name == name" class="delete-button" size="sm" dense @click="deleteMessage(message.time, false)">Deletar</q-btn>
      </div>
      <p class="text-center text-grey">Sem mais conversas para mostrar</p>
    </div>
    <div id="form" class="q-pa-sm fixed-bottom shadow-3 bg-white">
      <q-input class="full-width" :label="'Mensagem (como ' + name + ')...'" v-model="msg" @keyup.enter="enviarMensagem()">
        <template v-slot:after>
          <q-btn color="accent" label="Enviar" @click="enviarMensagem()" class="cursor-pointer" />
        </template>
      </q-input>
      <div class="q-pa-sm q-mt-md q-mb-md flex justify-between shadow-1 rounded-borders">
        <div>
          <p class="q-mb-none">Conectado como:</p>
          <q-chip>
            <q-avatar size="md">
              <img :src="image">
            </q-avatar>
            {{name}}
          </q-chip>
        </div>
        <q-btn @click="disconnect()" size="sm" color="red-5">Desconectar</q-btn>
      </div>
    </div>

    <q-dialog v-model="userPromptModal" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Informações de Usuário</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input label="Nome" dense v-model="name" autofocus />
        </q-card-section>
        <q-card-section class="q-pt-none">
          <q-file v-model="fileImage" type="file" name="myfile" id="myfile" label="Selecione um avatar..."/>
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn @click="setUserImage()" flat label="Concluído" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="deleteAllPrompt" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Deseja deletar TODAS as mensagens?</div>
        </q-card-section>
        <q-card-actions align="right" class="text-primary">
          <q-btn flat label="Não" v-close-popup />
          <q-btn @click="deleteAll()" flat label="Sim" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
const toBase64 = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = error => reject(error);
});

export default {
  name: 'PageIndex',
  data () {
    return {
      deleteAllPrompt: false,
      userPromptModal: false,
      fileImage: null,
      socket: null,
      name: "",
      image: defaultImage,
      msg: "",
      time: "",
      messages: []
    }
  },
  created () {

    //Verificar "Usuario"
    if(!this.$q.localStorage.getItem('userName')) {
      this.userPromptModal = true
    }else {
      this.name = this.$q.localStorage.getItem('userName')
      this.image = this.$q.localStorage.getItem('userImage')
    }

    //Verificar Mensagens salvas
    if(this.$q.localStorage.getItem('messageList')) {
      let localMessages = this.$q.localStorage.getItem('messageList')
      localMessages.forEach(message => {
        this.messages.push(message)
      });
    }

    let vm = this
    this.socket = this.$io("http://192.168.100.10:7777");
    this.socket.on('chat message', function(obj) {
      //TODO: Guardar Imagem no localStorage
      if(!vm.$q.localStorage.getItem('messageList')) {
        //Se nao existir, cria e coloca a primeira mensagem
        vm.$q.localStorage.set('messageList', [obj])
      }else {
        //Se já existir, pega, adiciona mensagem e guarda
        let localMessages = vm.$q.localStorage.getItem('messageList')
        localMessages.push(obj)
        vm.$q.localStorage.set('messageList', localMessages)
      }
      //Renderizar Imagem
      vm.messages.push(obj)
      vm.scrollBottom()
    });
    this.socket.on('delete message', function(id) {
      vm.deleteMessage(id, true)
    })
  },
  methods: {
    disconnect() {
      this.$q.localStorage.set('userName', '')
      this.$q.localStorage.set('userImage', '')
      this.userPromptModal = true
    },
    enviarMensagem() {
      if(this.msg != "" && this.name != "") {
        this.socket.emit('chat message', {name: this.name, msg: this.msg, image: this.image});
        this.msg = "";
      }
    },
    setUserImage: async function() {
      if(this.name == "") {
        this.name = "Nome não definido"
      }
      if(this.fileImage) {
        this.image = await toBase64(this.fileImage)
      }
      
      this.$q.localStorage.set('userName', this.name)
      this.$q.localStorage.set('userImage', this.image)
    },
    scrollBottom() {
      window.scrollTo(0, document.getElementById('messages').scrollHeight);
    },
    deleteAll() {
      this.$q.localStorage.set('messageList', [])
      this.messages = []
    },
    deleteMessage(id, isFromSocket) {
      if(isFromSocket == false) {
        this.socket.emit('delete message', id);
      }
      console.log(id)
      let localMessages = this.$q.localStorage.getItem('messageList')
      let newMessages = []
      if(id) {
        localMessages.forEach((message) => {
          if(message.time != id) {
            newMessages.push(message)
          }
        })
        this.messages = []
        newMessages.forEach(message => {
          this.messages.push(message)
        });
        this.$q.localStorage.set('messageList', newMessages)
      }
    }
  },
  mounted () {
    this.scrollBottom()
  }
}

const defaultImage = "data:image/png;base64,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"
</script>

<style scoped>
#messages {
  margin-top: 10px;
  margin-bottom: 230px;
}
.delete-button {
  margin-top: -34px;
  right: 0;
  position: absolute;
}
</style>