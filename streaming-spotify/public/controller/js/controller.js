export default class Controller {
  constructor({ view, service }) {
    this.view = view
    this.service = service
  }

  static initialize(deps) {
    const controller = new Controller(deps)
    controller.onLoad()

    return controller
  }

  async onCommandReceived(text) {
    return this.service.makeRequest({
      command: text
    })
  }

  onLoad() {
    this.view.configureOnBtnClick(this.onCommandReceived.bind(this))
    this.view.onLoad()
  }

}