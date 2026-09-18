const renderGifts = async () => {
  const response = await fetch('/gifts')
  const data = await response.json()
  const mainContent = document.getElementById('main-content')

  if (data) {
    data.map(gift => {
      const card = document.createElement('div')
      card.classList.add('card')
      const topContainer = document.createElement('div')
      topContainer.classList.add('top-container')
      const bottomContainer = document.createElement('div')
      bottomContainer.classList.add('bottom-container')

      topContainer.style.backgroundImage = `url(${gift.image})`

      const cardName = document.createElement('h3')
      cardName.textContent = gift.name
      bottomContainer.appendChild(cardName)

      const price = document.createElement('p')
      price.textContent = gift.price
      bottomContainer.appendChild(price)

      const audience = document.createElement('p')
      audience.textContent = gift.audience
      bottomContainer.appendChild(audience)

      const link = document.createElement('a')
      link.textContent = 'Read More >'
      link.href = `/gifts/${gift.id}`
      link.setAttribute('role', 'button')
      bottomContainer.appendChild(link)

      card.appendChild(topContainer)
      card.appendChild(bottomContainer)
      mainContent.appendChild(card)
    })

  }
  else {
    const message = document.createElement('h2')
    message.textContent = 'No Gifts Available 😞'
    mainContent.appendChild(message)
  }
}

const renderGift = async () => {
  const requestedId = parseInt(window.location.href.split('/').pop())
  const response = await fetch('/gifts')
  const data = await response.json()

  const giftContent = document.getElementById('gift-content')
  let gift

  gift = data.find(gift => gift.id === requestedId)

  if (gift) {
    const image = document.getElementById('image')
    image.src = gift.image

    const name = document.getElementById('name')
    name.textContent = gift.name

    const submittedBy = document.getElementById('submittedBy')
    submittedBy.textContent = gift.submittedBy

    const pricePoint = document.getElementById('pricePoint')
    pricePoint.textContent = gift.price

    const audience = document.getElementById('audience')
    audience.textContent = gift.audience

    const description = document.getElementById('description')
    description.textContent = gift.description

    document.title = `UnEarthed - ${gift.name}`

  }
  else {
    const message = document.createElement('h2')
    message.textContent = 'No Gift Found 😞'
    giftContent.appendChild(message)
  }

}

renderGifts()
renderGift()
