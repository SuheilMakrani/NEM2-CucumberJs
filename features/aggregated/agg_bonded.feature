Feature: aggregate bonded transaction
    Scenario Outline: aggregate bonded transaction
        Given "<bob_privatekey>" wants to ask "<alice_publickey>" for 20 xems on "<host_url>"
        When bob creates an aggregate bonded transaction by creating first inner transaction
        And bob defines the second inner transaction
        Then bob wraps the defined transaction in an aggregate bonded transaction
        And bob announces the transaction to the network locking first 10 xems

        Examples:
            | host_url                        | bob_privatekey                                                   |  alice_publickey                                                  |
            | http://catapult48gh23s.xyz:3000 | 02FD6F158A8E6FC348EEFA5641B1533EE515CE33E6BF6ECEB3C4DE91278BB031 |  E369D06A38663FDDD56BBF22B3B9EB8E05798BCA973225CF3E5AB33085015C1F |
