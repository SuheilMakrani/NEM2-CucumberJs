Feature: secret lock transaction
    Enable atomic cross chain swap between NEM public and private chain

    Scenario Outline: secret lock transaction
        Given "<alice_privatekey_chain1>""<alice_privatekey_chain2>" wants to send a transaction from "<nodeUrl1>" to "<bob_privatekey_chain1>" "<bob_privatekey_chain2>" at "<nodeUrl2>"
        When Alice creates, announces and signs secret lock transaction on the private chain
        And Bob creates, announces and signs secret lock transaction on the public chain
        Then Alice can announce a secret proof transaction
        And Bob can announce a secret proof transaction to unlock funds

        Examples:
            | nodeUrl1                        | nodeUrl2                               | alice_privatekey_chain1                                          | alice_privatekey_chain2                                          | bob_privatekey_chain1                                            | bob_privatekey_chain2                                            |
            | http://catapult48gh23s.xyz:3000 | http://api.beta.catapult.mijin.io:3000 | 8589CBBCBAF5046F4C47CC1A715A37BC20548B4A6A5F44564B23929E9782D968 | 3C24C5E43102A2A715E6215D53DF703ECD8230C0B971236D1324EF5B51FA2C73 | 02FD6F158A8E6FC348EEFA5641B1533EE515CE33E6BF6ECEB3C4DE91278BB031 | A192AAC4E387BC209544E4166CEF822C832CB2800C0CC37E2446A4338CF5F0F5 |
